import { expect, test, type Page } from "@playwright/test";

const bookingForm = (page: Page) => page.getByRole("form", { name: "Tạo lịch nhanh", exact: true });

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test("clearing and repairing time preserves draft and never creates a booking implicitly", async ({ page }, testInfo) => {
  const errors: string[] = [];
  const writes: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) writes.push(request.method() + " " + request.url());
  });
  await page.goto("/calendar?" + new URLSearchParams({ customer: "Trần Thu Hà" }));
  const form = bookingForm(page);
  const time = form.getByLabel("Giờ", { exact: true });
  await expect(form.getByLabel("Khách hàng", { exact: true })).toHaveValue("Trần Thu Hà");
  await time.fill("");
  await expect(time).toHaveAttribute("aria-invalid", "true");
  await expect(time).toHaveAttribute("aria-describedby", "booking-time-feedback");
  await expect(page.locator("#booking-time-feedback")).toContainText("Chọn giờ hợp lệ");
  await expect(form.getByRole("button", { name: "+ Thêm lịch", exact: true })).toBeDisabled();
  await expect(form.getByLabel("Khách hàng", { exact: true })).toHaveValue("Trần Thu Hà");
  await expect(page.locator("article")).toHaveCount(6);
  // Exercise handler-level validation as well as the disabled submit control.
  await form.dispatchEvent("submit");
  await expect(page.locator("article")).toHaveCount(6);
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("booking-time-cleared.png"), fullPage: true });

  await time.fill("16:00");
  await expect(time).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#booking-time-feedback")).toHaveCount(0);
  await expect(form.getByText("16:00–17:00", { exact: true })).toBeVisible();
  await expect(page.locator("article")).toHaveCount(6);
  await form.getByLabel("Khách hàng", { exact: true }).fill("Khách sửa giờ mẫu");
  await form.getByRole("button", { name: "+ Thêm lịch", exact: true }).click();
  await expect(form.getByRole("status")).toContainText("Đã thêm lịch mẫu. Chưa lưu dữ liệu thật.");
  await expect(page.locator("article").filter({ hasText: "Khách sửa giờ mẫu" })).toHaveCount(1);
  await page.reload();
  await expect(page.locator("article").filter({ hasText: "Khách sửa giờ mẫu" })).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(writes).toEqual([]);
});

test("overnight requests are held and midnight finish does not wrap to the next day", async ({ page }, testInfo) => {
  await page.goto("/calendar");
  const form = bookingForm(page);
  await form.getByLabel("Khách hàng", { exact: true }).fill("Khách sát cuối ngày");
  await form.getByLabel("Giờ", { exact: true }).fill("23:30");
  await expect(page.locator("#booking-time-feedback")).toContainText("Dịch vụ vượt sang ngày hôm sau");
  await expect(form.getByRole("button", { name: "+ Thêm lịch", exact: true })).toBeDisabled();
  await form.dispatchEvent("submit");
  await expect(page.locator("article")).toHaveCount(6);
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("booking-overnight-held.png"), fullPage: true });
  await form.getByLabel("Giờ", { exact: true }).fill("23:00");
  await expect(form.getByText("23:00–24:00", { exact: true })).toBeVisible();
  await expect(page.locator("#booking-time-feedback")).toHaveCount(0);
  await form.getByRole("button", { name: "+ Thêm lịch", exact: true }).click();
  const created = page.locator("article").filter({ hasText: "Khách sát cuối ngày" });
  await expect(created).toHaveCount(1);
  await expect(created.getByText("24:00", { exact: true })).toBeVisible();
  await expect(form.getByRole("status")).toContainText("23:00–24:00");
  await noOverflow(page);
});

test("changing service or clearing time repeatedly is recoverable without losing customer", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/calendar");
  const form = bookingForm(page);
  await form.getByLabel("Khách hàng", { exact: true }).fill("Khách thử thời lượng");
  await form.getByLabel("Giờ", { exact: true }).fill("22:30");
  await form.getByLabel("Dịch vụ", { exact: true }).selectOption({ label: "Nhuộm Balayage" });
  await expect(form.getByRole("button", { name: "+ Thêm lịch", exact: true })).toBeDisabled();
  await expect(page.locator("#booking-time-feedback")).toContainText("vượt sang ngày hôm sau");
  await form.getByLabel("Dịch vụ", { exact: true }).selectOption({ label: "Cắt + tạo kiểu" });
  await expect(form.getByText("22:30–23:30", { exact: true })).toBeVisible();
  for (const repaired of ["00:00", "09:05", "16:00"]) {
    await form.getByLabel("Giờ", { exact: true }).fill("");
    await expect(form.getByRole("button", { name: "+ Thêm lịch", exact: true })).toBeDisabled();
    await form.getByLabel("Giờ", { exact: true }).fill(repaired);
    await expect(form.getByRole("button", { name: "+ Thêm lịch", exact: true })).toBeEnabled();
  }
  await expect(form.getByLabel("Khách hàng", { exact: true })).toHaveValue("Khách thử thời lượng");
  await expect(page.locator("article")).toHaveCount(6);
  expect(errors).toEqual([]);
});

test("repairing time retains overlap prevention and missing-customer validation", async ({ page }) => {
  await page.goto("/calendar");
  const form = bookingForm(page);
  await form.getByLabel("Giờ", { exact: true }).fill("");
  await form.getByLabel("Giờ", { exact: true }).fill("10:30");
  await form.getByRole("button", { name: "+ Thêm lịch", exact: true }).click();
  await expect(form.getByRole("status")).toContainText("Vui lòng điền đủ thông tin");
  await expect(page.locator("article")).toHaveCount(6);
  await form.getByLabel("Khách hàng", { exact: true }).fill("Khách tránh trùng lịch");
  await form.getByRole("button", { name: "+ Thêm lịch", exact: true }).click();
  await expect(form.getByRole("status")).toContainText("Không thể đặt: Lan đang có lịch");
  await expect(page.locator("article")).toHaveCount(6);
  await expect(form.getByLabel("Khách hàng", { exact: true })).toHaveValue("Khách tránh trùng lịch");
  await form.getByLabel("Giờ", { exact: true }).fill("16:00");
  await form.getByRole("button", { name: "+ Thêm lịch", exact: true }).click();
  await expect(page.locator("article").filter({ hasText: "Khách tránh trùng lịch" })).toHaveCount(1);
});
