import { expect, test } from "@playwright/test";

test("specialist service cannot be assigned to an unsupported stylist", async ({ page }, testInfo) => {
  const errors: string[] = [];
  const writes: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) writes.push(request.method() + " " + request.url());
  });
  await page.goto("/calendar");
  const form = page.getByRole("form", { name: "Tạo lịch nhanh", exact: true });
  await form.getByLabel("Khách hàng", { exact: true }).fill("Khách nhuộm mẫu");
  await form.getByLabel("Giờ", { exact: true }).fill("16:00");
  await form.getByLabel("Dịch vụ", { exact: true }).selectOption({ label: "Nhuộm Balayage" });
  const stylist = form.getByLabel("Nhân sự", { exact: true });
  await expect(stylist).toHaveValue("Lan");
  await expect(stylist).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#booking-staff-feedback")).toContainText("Lan không thực hiện Nhuộm Balayage");
  await expect(stylist.locator('option[value="Lan"]')).toHaveJSProperty("disabled", true);
  await expect(stylist.locator('option[value="Hương"]')).toHaveJSProperty("disabled", true);
  await expect(stylist.locator('option[value="Vy"]')).toHaveJSProperty("disabled", false);
  await expect(form.getByRole("button", { name: "+ Thêm lịch", exact: true })).toBeDisabled();
  await form.dispatchEvent("submit");
  await expect(page.locator("article")).toHaveCount(6);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("booking-capability-held.png"), fullPage: true });
  await stylist.selectOption("Vy");
  await expect(stylist).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#booking-staff-feedback")).toHaveCount(0);
  await expect(form.getByLabel("Khách hàng", { exact: true })).toHaveValue("Khách nhuộm mẫu");
  await expect(form.getByLabel("Giờ", { exact: true })).toHaveValue("16:00");
  await expect(form.getByText("16:00–19:00", { exact: true })).toBeVisible();
  await form.getByRole("button", { name: "+ Thêm lịch", exact: true }).click();
  const created = page.locator("article").filter({ hasText: "Khách nhuộm mẫu" });
  await expect(created).toHaveCount(1);
  await expect(created).toContainText("Nhuộm Balayage · Vy");
  await expect(form.getByRole("status")).toContainText("Chưa lưu dữ liệu thật");
  expect(errors).toEqual([]);
  expect(writes).toEqual([]);
});

test("shared services allow qualified choices and require explicit reassignment for specialist work", async ({ page }) => {
  await page.goto("/calendar");
  const form = page.getByRole("form", { name: "Tạo lịch nhanh", exact: true });
  const stylist = form.getByLabel("Nhân sự", { exact: true });
  const service = form.getByLabel("Dịch vụ", { exact: true });
  await expect(stylist.locator('option[value="Lan"]')).toHaveJSProperty("disabled", false);
  await expect(stylist.locator('option[value="Hương"]')).toHaveJSProperty("disabled", false);
  await expect(stylist.locator('option[value="Vy"]')).toHaveJSProperty("disabled", true);
  await stylist.selectOption("Hương");
  await service.selectOption({ label: "Uốn phục hồi" });
  await expect(stylist).toHaveValue("Hương");
  await expect(form.getByRole("button", { name: "+ Thêm lịch", exact: true })).toBeDisabled();
  await expect(page.locator("#booking-staff-feedback")).toContainText("Hương không thực hiện Uốn phục hồi");
  await service.selectOption({ label: "Gội dưỡng" });
  await expect(stylist).toHaveValue("Hương");
  await expect(form.getByRole("button", { name: "+ Thêm lịch", exact: true })).toBeEnabled();
  await expect(page.locator("#booking-staff-feedback")).toHaveCount(0);
  await expect(page.locator("article")).toHaveCount(6);
});

test("qualified stylist still cannot bypass time or overlap guards", async ({ page }) => {
  await page.goto("/calendar");
  const form = page.getByRole("form", { name: "Tạo lịch nhanh", exact: true });
  await form.getByLabel("Khách hàng", { exact: true }).fill("Khách kiểm tra thợ bận");
  await form.getByLabel("Dịch vụ", { exact: true }).selectOption({ label: "Nhuộm Balayage" });
  await form.getByLabel("Nhân sự", { exact: true }).selectOption("Vy");
  await form.getByLabel("Giờ", { exact: true }).fill("");
  await expect(form.getByRole("button", { name: "+ Thêm lịch", exact: true })).toBeDisabled();
  await form.getByLabel("Giờ", { exact: true }).fill("10:00");
  await form.getByRole("button", { name: "+ Thêm lịch", exact: true }).click();
  await expect(form.getByRole("status")).toContainText("Không thể đặt: Vy đang có lịch");
  await expect(page.locator("article")).toHaveCount(6);
  await form.getByLabel("Giờ", { exact: true }).fill("22:00");
  await expect(form.getByRole("button", { name: "+ Thêm lịch", exact: true })).toBeDisabled();
  await expect(page.locator("#booking-time-feedback")).toContainText("vượt sang ngày hôm sau");
});
