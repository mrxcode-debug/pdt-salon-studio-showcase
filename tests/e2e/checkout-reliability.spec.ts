import { expect, test } from "@playwright/test";

test("successful demo checkout cannot be finalized twice", async ({ page }, testInfo) => {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) writes.push(request.method() + " " + request.url());
  });
  await page.goto("/checkout");
  const button = page.getByRole("button", { name: "Chốt thanh toán mẫu", exact: true });
  await button.click();
  const completed = page.getByRole("button", { name: "Đã chốt trong phiên demo", exact: true });
  await expect(completed).toBeDisabled();
  await expect(page.getByText("✓ Thanh toán hợp lệ")).toHaveCount(1);
  await expect(page.getByText("247.500", { exact: false })).toBeVisible();
  await expect(page.getByText("-1 chai", { exact: true })).toHaveCount(1);
  await completed.dispatchEvent("click");
  await expect(page.getByText("✓ Thanh toán hợp lệ")).toHaveCount(1);
  await expect(page.getByText("-1 chai", { exact: true })).toHaveCount(1);
  expect(writes).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("checkout-finalized-once.png"), fullPage: true });
});

test("changing product after success explicitly starts a new demo draft", async ({ page }) => {
  await page.goto("/checkout");
  await page.getByRole("button", { name: "Chốt thanh toán mẫu", exact: true }).click();
  await page.getByRole("checkbox").uncheck();
  await expect(page.getByText("Chưa chốt. Dữ liệu chỉ thay đổi trong phiên demo.")).toBeVisible();
  const button = page.getByRole("button", { name: "Chốt thanh toán mẫu", exact: true });
  await expect(button).toBeEnabled();
  await expect(page.getByText("1.650.000", { exact: false }).last()).toBeVisible();
  await button.click();
  await expect(page.getByRole("button", { name: "Đã chốt trong phiên demo", exact: true })).toBeDisabled();
  await expect(page.getByText("-1 chai", { exact: true })).toHaveCount(0);
  await expect(page.getByText("247.500", { exact: false })).toBeVisible();
});
