import { expect, test } from "@playwright/test";

test("owner dashboard answers core questions without horizontal overflow", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Tổng quan hôm nay" })).toBeVisible();

  const metrics = page.locator(".metrics-grid");
  await expect(metrics.getByText("Chưa thu", { exact: true })).toBeVisible();
  await expect(metrics.getByText(/1\.630\.000/)).toBeVisible();
  await expect(metrics.getByText("No-show", { exact: true })).toBeVisible();
  await expect(metrics.getByText("Cần tái đặt", { exact: true })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);

  await page.screenshot({
    path: testInfo.outputPath("dashboard.png"),
    fullPage: true
  });
});

test("booking guard rejects overlap and accepts a free slot", async ({ page }) => {
  await page.goto("/calendar");

  await page.getByLabel("Khách hàng").fill("Khách Test");
  await page.getByLabel("Giờ").fill("10:45");
  await page.getByLabel("Nhân sự", { exact: true }).selectOption({ label: "Lan" });
  await page.getByLabel("Dịch vụ").selectOption({ label: "Cắt + tạo kiểu" });
  await page.getByRole("button", { name: "+ Thêm lịch" }).click();

  await expect(page.getByText(/Không thể đặt: Lan đang có lịch/)).toBeVisible();

  await page.getByLabel("Giờ").fill("14:00");
  await page.getByRole("button", { name: "+ Thêm lịch" }).click();

  await expect(page.getByText("Khách Test")).toBeVisible();
  await expect(page.getByText("Đã thêm lịch mẫu. Chưa lưu dữ liệu thật.")).toBeVisible();
});

test("checkout creates paid output, customer history and rebook trace", async ({ page }, testInfo) => {
  await page.goto("/checkout");
  await page.getByRole("button", { name: "Chốt thanh toán mẫu" }).click();

  const resultCard = page.getByRole("heading", { name: "Kết quả sau checkout" }).locator("..");
  await expect(resultCard.getByText("✓ Thanh toán hợp lệ")).toBeVisible();
  await expect(resultCard.getByText(/2\.300\.000/).first()).toBeVisible();
  await expect(resultCard.getByText("a2")).toBeVisible();
  await expect(resultCard.getByText("9 lần ghé")).toBeVisible();
  await expect(resultCard.getByText("05/11/2026")).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath("checkout.png"),
    fullPage: true
  });
});

test("retention queue exposes rebook and no-show work", async ({ page }, testInfo) => {
  await page.goto("/retention");
  await expect(page.getByRole("heading", { name: "Tái đặt & no-show" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Khách đến hạn quay lại" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cần xử lý hôm nay" })).toBeVisible();
  await expect(page.getByText("Đỗ Mỹ Linh")).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);

  await page.screenshot({
    path: testInfo.outputPath("retention.png"),
    fullPage: true
  });
});

test("pilot journey runs confirmed through completed and rebook", async ({ page }, testInfo) => {
  await page.goto("/pilot");
  const journey = page.getByTestId("pilot-journey");

  await expect(journey.getByText("Đã xác nhận")).toBeVisible();
  await journey.getByRole("button", { name: "Khách đã đến" }).click();
  await expect(journey.getByText("Đã đến")).toBeVisible();

  await journey.getByRole("button", { name: "Bắt đầu dịch vụ" }).click();
  await expect(journey.getByText("Đang làm")).toBeVisible();

  await journey.getByRole("button", { name: "Thanh toán & hoàn tất" }).click();
  await expect(journey.getByText("Hoàn tất", { exact: true })).toBeVisible();
  await expect(journey.getByText("Đã thu đủ")).toBeVisible();
  await expect(journey.getByText("10 lần ghé")).toBeVisible();
  await expect(journey.getByText("05/11/2026")).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath("pilot-journey.png"),
    fullPage: true
  });
});
