import { expect, test } from "@playwright/test";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
}

test("Salon V2 owner command center keeps exception-first hierarchy", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByText("HÔM NAY CẦN CHỐT")).toBeVisible();
  await expect(page.getByText(/tín hiệu cần owner chú ý/)).toBeVisible();
  await expect(page.getByText("Cần thu", { exact: true })).toBeVisible();
  await expect(page.getByText("Lịch cần chốt", { exact: true })).toBeVisible();
  await expect(page.getByText("Khách cần giữ", { exact: true })).toBeVisible();
  await expect(page.getByText("Kho cần chú ý", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("v2-owner-dashboard.png"), fullPage: true });
});

test("Salon V2 booking command board filters staff and remains usable", async ({ page }, testInfo) => {
  await page.goto("/calendar");
  await expect(page.getByRole("region", { name: "Tải lịch theo nhân sự" })).toBeVisible();
  await page.getByRole("button", { name: /Lan/ }).first().click();
  await expect(page.getByText("Nguyễn Minh Anh")).toBeVisible();
  await expect(page.getByText("Phạm Bảo Ngọc")).toBeVisible();
  await expect(page.getByText("Trần Thu Hà")).toHaveCount(0);
  await expect(page.getByText(/Khung dự kiến/)).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("v2-booking-calendar.png"), fullPage: true });
});

test("Salon V2 Customer 360 search exposes owner action signals", async ({ page }, testInfo) => {
  await page.goto("/customers");
  await page.getByLabel("Tìm khách hàng").fill("Mai");
  await expect(page.getByRole("heading", { name: "Lê Ngọc Mai" })).toBeVisible();
  await expect(page.getByText("Cần giữ", { exact: true })).toBeVisible();
  await expect(page.getByText(/Đã hơn 45 ngày chưa quay lại/)).toBeVisible();
  await expect(page.getByText("Gội dưỡng", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("v2-customer-360.png"), fullPage: true });
});

test("Salon V2 staff service view exposes load commission and dependency", async ({ page }, testInfo) => {
  await page.goto("/services");
  await expect(page.getByRole("heading", { name: "Công suất & hoa hồng" })).toBeVisible();
  await expect(page.getByText("GẦN ĐẦY", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("PHỤ THUỘC 1 NGƯỜI", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Hoa hồng", { exact: true }).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("v2-staff-service.png"), fullPage: true });
});

test("Salon V2 retention queue exposes deterministic priority signals", async ({ page }, testInfo) => {
  await page.goto("/retention");
  await expect(page.getByText("HÀNG", { exact: true })).toHaveCount(0);
  await expect(page.getByText("57", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Ưu tiên", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Không gửi SMS\/Zalo trong pilot/)).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("v2-retention.png"), fullPage: true });
});
