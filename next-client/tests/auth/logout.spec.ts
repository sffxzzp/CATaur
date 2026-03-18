import { test, expect } from "@playwright/test";
import { login, logout } from "../helpers/auth-helper";
import { users } from "../fixtures/users";

/**
 * Logout Test Suite
 *
 * This test suite verifies that users from all roles
 * can successfully log out of the system.
 *
 * Instead of relying on URL redirection, logout success is validated
 * using UI-based assertions (login form visibility).
 * This approach ensures test stability even when redirect behavior is inconsistent.
 */

const roles = Object.keys(users) as (keyof typeof users)[];

test.describe("Logout Tests (All Roles)", () => {
  // Iterate through each user role dynamically
  for (const role of roles) {
    test(`${role} can logout successfully`, async ({ page }) => {
      const user = users[role];

      /**
       * Step 1: Perform login
       * Navigate to role-specific login page and authenticate user
       */
      await login(page, role, user.email, user.password);

      /**
       * Step 2: Verify login success
       * Ensure user is no longer on login page and main layout is visible
       */
      await expect(page).not.toHaveURL(/login/);
      await expect(page.locator("header")).toBeVisible();

      /**
       * Step 3: Perform logout
       * Uses reusable helper that handles UI variations across roles
       */
      await logout(page, role);

      /**
       * Step 4: Verify logout success (UI-based validation)
       * Check that login form is visible again
       */
      await expect(page.getByPlaceholder("you@example.com")).toBeVisible();

      /**
       * Additional validation:
       * Ensure "Sign in" button is visible, confirming user is unauthenticated
       */
      await expect(
        page.getByRole("button", { name: /sign in/i }),
      ).toBeVisible();
    });
  }
});
