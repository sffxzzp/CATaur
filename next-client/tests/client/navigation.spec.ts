import { test, expect, type Page } from "@playwright/test";

/**
 * Helper: Login as client
 */
async function login(
  page: Page,
  role: string,
  email: string,
  password: string
) {
  await page.goto(`http://127.0.0.1:3001/login?role=${role}`);

  await page.getByLabel(/Email/i).fill(email);
  await page.getByLabel(/Password/i).fill(password);

  await page.getByRole("button", { name: /sign in/i }).click();

  // wait for redirect to client dashboard
  await page.waitForURL(/\/client/);
}

/**
 * Test Suite
 */
test.describe("Client - Navigation", () => {

  /**
   * TC001
   * Verify that the client can navigate to Job Orders
   */
  test("TC001 - Client can navigate to Job Orders", async ({ page }) => {

    await login(page, "client", "mike@outlook.com", "1234567890");

    await page.locator('a[href="/client/orders"]').click();

    await expect(page).toHaveURL(/client\/orders/);

    await expect(page.getByText(/Job Orders/i)).toBeVisible();

  });

  /**
   * TC002
   * Verify that the client can navigate to Candidates
   */
  test("TC002 - Client can navigate to Candidates", async ({ page }) => {

    await login(page, "client", "mike@outlook.com", "1234567890");

    await page.locator('a[href="/client/candidates"]').click();

    await expect(page).toHaveURL(/candidates/i);

    await expect(page.getByText(/^Candidates$/i)).toBeVisible();

  });

  /**
   * TC003
   * Verify that the client can navigate to Decisions
   */
  test("TC003 - Client can navigate to Decisions", async ({ page }) => {

    await login(page, "client", "mike@outlook.com", "1234567890");

    await page.locator('a[href="/client/decisions"]').click();

    await expect(page).toHaveURL(/decisions/i);

    await expect(page.getByText(/^Decisions$/i)).toBeVisible();

  });

  /**
   * TC004
   * Verify that the client can navigate back to Dashboard
   */
  test("TC004 - Client can navigate back to Dashboard", async ({ page }) => {

    await login(page, "client", "mike@outlook.com", "1234567890");

    await page.locator('a[href="/client/candidates"]').click();

    await page.locator('a[href="/client"]').click();

    await expect(page).toHaveURL(/\/client$/);

    await expect(page.getByText(/^Dashboard$/i)).toBeVisible();

  });

});