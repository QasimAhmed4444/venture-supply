import { test, expect } from "@playwright/test";

const B2C_EMAIL = "e2e.checkout@test.sa";
const B2C_PASSWORD = "TestB2C@2024!";
const PRODUCT_ID = "p-chef-1121-sella";
const PRODUCT_SLUG = "chef-rice-1121-sella-basmati";

test.describe("B2C checkout flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("input-login-email").fill(B2C_EMAIL);
    await page.getByTestId("input-login-password").fill(B2C_PASSWORD);
    await page.getByTestId("button-login-submit").click();
    await page.waitForURL("/", { timeout: 10_000 });
  });

  test("B2C customer can add an item to cart, checkout, and place an order", async ({ page }) => {
    await page.goto(`/products/${PRODUCT_SLUG}`);
    await page.getByTestId("button-add-to-cart").click();

    await page.goto("/cart");
    await expect(page.getByTestId(`cart-page-item-${PRODUCT_ID}`)).toBeVisible();
    await page.getByTestId("button-proceed-checkout").click();

    await page.waitForURL("**/checkout", { timeout: 10_000 });

    const nameInput = page.getByTestId("input-name");
    if (!(await nameInput.inputValue())) {
      await nameInput.fill("E2E Test User");
    }

    const phoneInput = page.getByTestId("input-phone");
    if (!(await phoneInput.inputValue())) {
      await phoneInput.fill("0500000001");
    }

    const cityInput = page.getByTestId("input-city");
    await cityInput.fill("Riyadh");

    const addressInput = page.getByTestId("input-address");
    await addressInput.fill("123 Test Street, Al Malaz");

    await page.getByTestId("radio-order-type-delivery").click();
    await page.getByTestId("radio-payment-cod").click();

    await page.getByTestId("button-place-order").click();

    await page.waitForURL("**/order-success**", { timeout: 20_000 });
    await expect(page.getByTestId("text-tracking-id")).toBeVisible();
  });
});
