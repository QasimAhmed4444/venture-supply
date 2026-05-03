import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@venturesupply.sa";
const ADMIN_PASSWORD = "pakistan12345";
const SALES_EMAIL = "sales@venturesupply.sa";
const SALES_PASSWORD = "TestSales@2024!";

test.describe("Staff login", () => {
  test("admin login with correct credentials lands on /admin dashboard", async ({ page }) => {
    await page.goto("/admin/login");

    await page.getByTestId("tab-portal-admin").click();
    await page.getByTestId("input-admin-email").fill(ADMIN_EMAIL);
    await page.getByTestId("input-admin-password").fill(ADMIN_PASSWORD);
    await page.getByTestId("button-admin-login-submit").click();

    await page.waitForURL("**/admin", { timeout: 15_000 });
    expect(page.url()).toMatch(/\/admin$/);
  });

  test("salesperson login with correct credentials lands on /sales dashboard", async ({ page }) => {
    await page.goto("/admin/login");

    await page.getByTestId("tab-portal-sales").click();
    await page.getByTestId("input-admin-email").fill(SALES_EMAIL);
    await page.getByTestId("input-admin-password").fill(SALES_PASSWORD);
    await page.getByTestId("button-admin-login-submit").click();

    await page.waitForURL("**/sales", { timeout: 15_000 });
    expect(page.url()).toMatch(/\/sales$/);
  });
});
