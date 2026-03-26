import { test, expect } from "@playwright/test";
import { login, logout } from "../helpers/auth-helper";
import { users } from "../fixtures/users";

/**
 * Logout Test (Role-Isolated)
 *
 * Each run only tests ONE role.
 * Controlled by:
 * - PLAYWRIGHT_BASE_URL
 * - TEST_ROLE
 */

const role = process.env.TEST_ROLE as keyof typeof users;

if (!role) {
  throw new Error("❌ TEST_ROLE is not defined");
}

test.describe(`Logout Test (${role})`, () => {
  test(`${role} can logout successfully`, async ({ page }) => {
    const user = users[role];

    /**
     * Step 1: Login
     */
    await login(page, role, user.email, user.password);

    /**
     * Step 2: Verify login success
     */
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator("header")).toBeVisible();

    /**
     * Step 3: Logout
     */
    await logout(page, role);

    /**
     * Step 4: Verify logout success (UI-based)
     */

    // Email input visible
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Sign in button visible
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

    /**
     * Step 5: Extra safety check (recommended)
     * Ensure user cannot access protected page after logout
     */
    await page.goto(`/dashboard`);

    await expect(page).toHaveURL(/login/);
  });
});
