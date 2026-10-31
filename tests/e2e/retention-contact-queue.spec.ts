import { expect, test, type Page } from "@playwright/test";

const queueName = "Danh sách liên hệ trong phiên demo";
const rebookName = "Nguyễn Khánh Linh";
const noShowName = "Đỗ Mỹ Linh";
const candidateRow = (page: Page, name: string) => page.locator("article").filter({ hasText: name });
const shortlist = (page: Page) => page.getByRole("region", { name: queueName, exact: true });

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test("selects rebook and no-show work without duplicate entries", async ({ page }, testInfo) => {
  await page.goto("/retention");
  await expect(shortlist(page)).toContainText("Chưa chọn khách để liên hệ.");
  const rebook = candidateRow(page, rebookName);
  const add = rebook.getByRole("button", { name: "Đưa vào hàng liên hệ", exact: true });
  await add.focus();
  await add.press("Enter");
  const selectedButton = rebook.getByRole("button", { name: "Đã chọn liên hệ", exact: true });
  await expect(selectedButton).toBeDisabled();
  await selectedButton.dispatchEvent("click");
  await expect(shortlist(page).getByRole("listitem")).toHaveCount(1);
  await candidateRow(page, noShowName).getByRole("button", { name: "Đưa vào hàng liên hệ", exact: true }).click();
  await expect(shortlist(page).getByRole("listitem")).toHaveCount(2);
  await expect(page.getByTestId("contact-shortlist-count")).toHaveText("2 mục · 2 chờ liên hệ · 0 đã đánh dấu");
  await expect(shortlist(page).getByRole("listitem", { name: rebookName + " · Tái đặt", exact: true })).toContainText("Nhuộm + phục hồi");
  await expect(shortlist(page).getByRole("listitem", { name: noShowName + " · Không đến", exact: true })).toContainText("Phục hồi Keratin");
  await page.getByRole("link", { name: "Xem danh sách liên hệ (2)", exact: true }).click();
  await expect(page).toHaveURL(/#contact-shortlist$/);
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("retention-shortlist-selected.png"), fullPage: true });
});

test("manual follow-up marks can be undone and removed without changing suggestions", async ({ page }, testInfo) => {
  await page.goto("/retention");
  const source = candidateRow(page, rebookName);
  await source.getByRole("button", { name: "Đưa vào hàng liên hệ", exact: true }).click();
  const item = shortlist(page).getByRole("listitem", { name: rebookName + " · Tái đặt", exact: true });
  const mark = item.getByRole("button", { name: "Đánh dấu đã liên hệ", exact: true });
  await expect(mark).toHaveAttribute("aria-pressed", "false");
  await mark.focus();
  await mark.press("Enter");
  await expect(item).toContainText("Đã đánh dấu liên hệ (demo)");
  const undo = item.getByRole("button", { name: "Chuyển lại chờ liên hệ", exact: true });
  await expect(undo).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("contact-shortlist-count")).toHaveText("1 mục · 0 chờ liên hệ · 1 đã đánh dấu");
  await undo.click();
  await expect(item).toContainText("Chờ liên hệ (demo)");
  await item.getByRole("button", { name: "Bỏ khỏi danh sách", exact: true }).click();
  await expect(shortlist(page).getByRole("listitem")).toHaveCount(0);
  await expect(source).toContainText(rebookName);
  await expect(source.getByRole("button", { name: "Đưa vào hàng liên hệ", exact: true })).toBeEnabled();
  await source.getByRole("button", { name: "Đưa vào hàng liên hệ", exact: true }).click();
  await expect(shortlist(page).getByRole("listitem")).toHaveCount(1);
  await expect(page.getByTestId("contact-shortlist-count")).toHaveText("1 mục · 1 chờ liên hệ · 0 đã đánh dấu");
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("retention-shortlist-follow-up.png"), fullPage: true });
});

test("contact work stays local and reload clears all marks", async ({ page }) => {
  const mutations: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) mutations.push(request.method() + " " + request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/retention");
  const storageBefore = await page.evaluate(() => ({ local: JSON.stringify(localStorage), session: JSON.stringify(sessionStorage) }));
  await candidateRow(page, noShowName).getByRole("button", { name: "Đưa vào hàng liên hệ", exact: true }).click();
  await shortlist(page).getByRole("button", { name: "Đánh dấu đã liên hệ", exact: true }).click();
  await expect(shortlist(page)).toContainText("Không gửi SMS/Zalo và không lưu dữ liệu thật.");
  await expect(shortlist(page).getByRole("status")).toContainText("không phải xác nhận cuộc gọi hay tin nhắn đã gửi");
  expect(await page.evaluate(() => ({ local: JSON.stringify(localStorage), session: JSON.stringify(sessionStorage) }))).toEqual(storageBefore);
  await page.reload();
  await expect(page.getByTestId("contact-shortlist-count")).toHaveText("0 mục · 0 chờ liên hệ · 0 đã đánh dấu");
  await expect(shortlist(page).getByRole("listitem")).toHaveCount(0);
  await expect(candidateRow(page, noShowName).getByRole("button", { name: "Đưa vào hàng liên hệ", exact: true })).toBeEnabled();
  expect(mutations).toEqual([]);
  expect(errors).toEqual([]);
});

test("all suggestions are actionable while customer-link navigation does not enqueue", async ({ page }) => {
  await page.goto("/retention?" + new URLSearchParams({ customer: "Lê Ngọc Mai" }));
  await expect(page.getByRole("region", { name: "Chăm sóc khách đã chọn" })).toBeVisible();
  await expect(page.getByTestId("contact-shortlist-count")).toHaveText("0 mục · 0 chờ liên hệ · 0 đã đánh dấu");
  const rows = page.locator("article");
  await expect(rows).toHaveCount(5);
  for (let index = 0; index < 5; index++) {
    await rows.nth(index).getByRole("button", { name: "Đưa vào hàng liên hệ", exact: true }).click();
  }
  await expect(shortlist(page).getByRole("listitem")).toHaveCount(5);
  await expect(page.getByTestId("contact-shortlist-count")).toHaveText("5 mục · 5 chờ liên hệ · 0 đã đánh dấu");
  for (let index = 0; index < 5; index++) {
    await shortlist(page).getByRole("button", { name: "Bỏ khỏi danh sách", exact: true }).first().click();
  }
  await expect(shortlist(page).getByRole("listitem")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Đưa vào hàng liên hệ", exact: true })).toHaveCount(5);
  await noOverflow(page);
});
