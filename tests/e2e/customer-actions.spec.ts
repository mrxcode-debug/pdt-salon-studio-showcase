import { expect, test, type Page } from "@playwright/test";

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

async function expectCustomerRoute(page: Page, pathname: string, customer: string, hash: string) {
  await expect(page).toHaveURL((url) => url.pathname === pathname && url.searchParams.get("customer") === customer && url.hash === hash);
}

test("profile booking action preserves the selected customer and remains demo-only", async ({ page }, testInfo) => {
  const mutations: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) mutations.push(request.method() + " " + request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/customers");
  await page.getByLabel("Tìm khách hàng").fill("744");
  const profile = page.getByRole("complementary", { name: "Customer 360 Trần Thu Hà" });
  const action = profile.getByRole("link", { name: "Tạo lịch mới", exact: true });
  await expect(action).toBeVisible();
  await action.focus();
  await expect(action).toBeFocused();
  await action.press("Enter");
  await expectCustomerRoute(page, "/calendar", "Trần Thu Hà", "#new-booking");
  const form = page.getByRole("form", { name: "Tạo lịch nhanh" });
  await expect(form.getByLabel("Khách hàng", { exact: true })).toHaveValue("Trần Thu Hà");
  await expect(page.locator("article")).toHaveCount(6);
  await expectNoOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("booking-prefill.png"), fullPage: true });

  // Navigation only supplies a draft. Explicit local submission is still required.
  await form.getByLabel("Khách hàng", { exact: true }).fill("Khách kiểm thử thao tác");
  await form.getByLabel("Giờ", { exact: true }).fill("16:00");
  await form.getByRole("button", { name: "+ Thêm lịch", exact: true }).click();
  await expect(form.getByRole("status")).toContainText("Đã thêm lịch mẫu. Chưa lưu dữ liệu thật.");
  await expect(page.locator("article").filter({ hasText: "Khách kiểm thử thao tác" })).toHaveCount(1);
  await page.reload();
  await expect(page.locator("article").filter({ hasText: "Khách kiểm thử thao tác" })).toHaveCount(0);
  await expect(page.getByLabel("Khách hàng", { exact: true })).toHaveValue("Trần Thu Hà");
  expect(mutations).toEqual([]);
  expect(errors).toEqual([]);
});

test("care action keeps exact customer context and returns to booking", async ({ page }, testInfo) => {
  await page.goto("/customers");
  await page.getByLabel("Tìm khách hàng").fill("Lê Ngọc Mai");
  const action = page.getByRole("complementary", { name: "Customer 360 Lê Ngọc Mai" }).getByRole("link", { name: "Chăm sóc khách", exact: true });
  await action.focus();
  await action.press("Enter");
  await expectCustomerRoute(page, "/retention", "Lê Ngọc Mai", "#customer-care");
  const care = page.getByRole("region", { name: "Chăm sóc khách đã chọn" });
  await expect(care.getByRole("heading", { name: "Lê Ngọc Mai", exact: true })).toBeVisible();
  await expect(care).toContainText("Da đầu nhạy cảm");
  await expect(care).toContainText("chưa thêm vào hàng liên hệ và chưa gửi tin");
  await expect(page.getByText("Nguyễn Khánh Linh", { exact: true })).toBeVisible();
  await expectNoOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("customer-care.png"), fullPage: true });
  await care.getByRole("link", { name: "Tạo lịch quay lại", exact: true }).click();
  await expectCustomerRoute(page, "/calendar", "Lê Ngọc Mai", "#new-booking");
  await expect(page.getByLabel("Khách hàng", { exact: true })).toHaveValue("Lê Ngọc Mai");
});

test("back navigation and another selection never reuse the previous customer", async ({ page }) => {
  await page.goto("/customers");
  await page.getByRole("button").filter({ hasText: "Phạm Bảo Ngọc" }).click();
  await page.getByRole("complementary", { name: "Customer 360 Phạm Bảo Ngọc" }).getByRole("link", { name: "Tạo lịch mới", exact: true }).click();
  await expect(page.getByLabel("Khách hàng", { exact: true })).toHaveValue("Phạm Bảo Ngọc");
  await page.goBack();
  await page.getByLabel("Tìm khách hàng").fill("744");
  await page.getByRole("complementary", { name: "Customer 360 Trần Thu Hà" }).getByRole("link", { name: "Tạo lịch mới", exact: true }).click();
  await expect(page.getByLabel("Khách hàng", { exact: true })).toHaveValue("Trần Thu Hà");
});

test("no-result search hides both actions and clearing restores the matching profile", async ({ page }) => {
  await page.goto("/customers");
  await page.getByLabel("Tìm khách hàng").fill("__no_synthetic_customer__");
  await expect(page.getByText("Không tìm thấy khách phù hợp.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Tạo lịch mới", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Chăm sóc khách", exact: true })).toHaveCount(0);
  await page.getByLabel("Tìm khách hàng").fill("");
  const profile = page.getByRole("complementary", { name: "Customer 360 Nguyễn Minh Anh" });
  await expect(profile.getByRole("link", { name: "Tạo lịch mới", exact: true })).toBeVisible();
  await expect(profile.getByRole("link", { name: "Chăm sóc khách", exact: true })).toBeVisible();
  await expectNoOverflow(page);
});

for (const pathname of ["/calendar", "/retention"]) {
  test(`${pathname} rejects unknown, empty and repeated customer parameters`, async ({ page }) => {
    const cases = [
      "customer=__unknown__",
      "customer=",
      new URLSearchParams([["customer", "Nguyễn Minh Anh"], ["customer", "Trần Thu Hà"]]).toString(),
      "customer=%3Cscript%3Eunsafe-customer%3C%2Fscript%3E"
    ];
    const invalidLinkAlert = page.locator('p[role="alert"]', { hasText: "Liên kết khách không hợp lệ" });
    for (const query of cases) {
      await page.goto(pathname + "?" + query);
      await expect(invalidLinkAlert).toContainText("Liên kết khách không hợp lệ");
      await expect(page.getByRole("link", { name: "Chọn lại khách", exact: true })).toBeVisible();
      if (pathname === "/calendar") {
        await expect(page.getByLabel("Khách hàng", { exact: true })).toHaveValue("");
      } else {
        await expect(page.getByRole("region", { name: "Chăm sóc khách đã chọn" })).toHaveCount(0);
      }
      await expectNoOverflow(page);
    }
    // Ordinary visits are not reported as invalid links.
    await page.goto(pathname);
    await expect(invalidLinkAlert).toHaveCount(0);
  });
}
