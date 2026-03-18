import { test, expect } from "@playwright/test";
import { login, logout } from "../helpers/auth-helper";
import { users } from "../fixtures/users";

/**
 * Test Suite: Multi-role login validation
 * This test ensures that all user roles can successfully log in
 * and are redirected to the correct landing page.
 */

test("All roles login", async ({ page }) => {
  // Type-safe role extraction
  const roles = Object.keys(users) as Array<keyof typeof users>;

  for (const role of roles) {
    const user = users[role];

    // Step 1: Login with current role
    await login(page, role, user.email, user.password);

    // Step 2: Verify user is no longer on login page
    await expect(page).not.toHaveURL(/login/);

    // Step 3: Verify role-specific landing page (stable selectors)
    if (role === "candidate") {
      await expect(page.getByRole("link", { name: "Profile" })).toBeVisible();
    }

    if (role === "client") {
      await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    }

    if (role === "admin") {
      await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
      await expect(page.getByText("User Management")).toBeVisible();
    }

    if (role === "recruiter") {
      await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    }

    // Step 4: Logout to reset session before next role
    await logout(page, role);
  }
});
