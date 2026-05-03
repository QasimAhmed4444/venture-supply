import { test, expect } from "@playwright/test";

test.describe("Auth guard redirects", () => {
  test("visiting /admin without auth redirects to /admin/login", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL("**/admin/login", { timeout: 10_000 });
    expect(page.url()).toContain("/admin/login");
  });

  test("visiting /sales without auth redirects to /admin/login", async ({ page }) => {
    await page.goto("/sales");
    await page.waitForURL("**/admin/login", { timeout: 10_000 });
    expect(page.url()).toContain("/admin/login");
  });
});

test.describe("API auth guard", () => {
  test("GET /api/orders without token returns 401", async ({ request }) => {
    const response = await request.get("/api/orders");
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });
});
