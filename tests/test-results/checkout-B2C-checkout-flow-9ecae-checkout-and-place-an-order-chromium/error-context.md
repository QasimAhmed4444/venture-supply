# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout.spec.ts >> B2C checkout flow >> B2C customer can add an item to cart, checkout, and place an order
- Location: e2e/checkout.spec.ts:17:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - link "Venture Supply" [ref=e6] [cursor=pointer]:
      - /url: /
      - img "Venture Supply" [ref=e8]
    - generic [ref=e11]:
      - tablist [ref=e12]:
        - tab "Sign in" [selected] [ref=e13]
        - tab "Register" [ref=e14]
      - tabpanel "Sign in" [ref=e15]:
        - generic [ref=e16]:
          - heading "Welcome back" [level=1] [ref=e17]
          - paragraph [ref=e18]: Sign in to your Venture Supply account
        - generic [ref=e19]:
          - generic [ref=e20]: Account type
          - generic [ref=e21]:
            - button "Personal (B2C)" [ref=e22]
            - button "Business (B2B)" [ref=e23]
        - generic [ref=e24]:
          - generic [ref=e25]:
            - text: Email
            - textbox "you@example.sa" [ref=e26]: e2e.checkout@test.sa
          - generic [ref=e27]:
            - text: Password
            - textbox [ref=e28]: TestB2C@2024!
          - button "Sign In" [ref=e29]
        - button "Forgot password?" [ref=e31]
    - paragraph [ref=e32]:
      - link "Back to Home" [ref=e33] [cursor=pointer]:
        - /url: /
        - generic [ref=e34]:
          - img [ref=e35]
          - text: Back to Home
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | const B2C_EMAIL = "e2e.checkout@test.sa";
  4  | const B2C_PASSWORD = "TestB2C@2024!";
  5  | const PRODUCT_ID = "p-chef-1121-sella";
  6  | const PRODUCT_SLUG = "chef-rice-1121-sella-basmati";
  7  | 
  8  | test.describe("B2C checkout flow", () => {
  9  |   test.beforeEach(async ({ page }) => {
  10 |     await page.goto("/login");
  11 |     await page.getByTestId("input-login-email").fill(B2C_EMAIL);
  12 |     await page.getByTestId("input-login-password").fill(B2C_PASSWORD);
  13 |     await page.getByTestId("button-login-submit").click();
> 14 |     await page.waitForURL("/", { timeout: 10_000 });
     |                ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  15 |   });
  16 | 
  17 |   test("B2C customer can add an item to cart, checkout, and place an order", async ({ page }) => {
  18 |     await page.goto(`/products/${PRODUCT_SLUG}`);
  19 |     await page.getByTestId("button-add-to-cart").click();
  20 | 
  21 |     await page.goto("/cart");
  22 |     await expect(page.getByTestId(`cart-page-item-${PRODUCT_ID}`)).toBeVisible();
  23 |     await page.getByTestId("button-proceed-checkout").click();
  24 | 
  25 |     await page.waitForURL("**/checkout", { timeout: 10_000 });
  26 | 
  27 |     const nameInput = page.getByTestId("input-name");
  28 |     if (!(await nameInput.inputValue())) {
  29 |       await nameInput.fill("E2E Test User");
  30 |     }
  31 | 
  32 |     const phoneInput = page.getByTestId("input-phone");
  33 |     if (!(await phoneInput.inputValue())) {
  34 |       await phoneInput.fill("0500000001");
  35 |     }
  36 | 
  37 |     const cityInput = page.getByTestId("input-city");
  38 |     await cityInput.fill("Riyadh");
  39 | 
  40 |     const addressInput = page.getByTestId("input-address");
  41 |     await addressInput.fill("123 Test Street, Al Malaz");
  42 | 
  43 |     await page.getByTestId("radio-order-type-delivery").click();
  44 |     await page.getByTestId("radio-payment-cod").click();
  45 | 
  46 |     await page.getByTestId("button-place-order").click();
  47 | 
  48 |     await page.waitForURL("**/order-success**", { timeout: 20_000 });
  49 |     await expect(page.getByTestId("text-tracking-id")).toBeVisible();
  50 |   });
  51 | });
  52 | 
```