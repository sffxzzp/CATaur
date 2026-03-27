import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth-helper";
import { users } from "../fixtures/users";

/**
 * ============================
 * POSITIVE TESTS
 * ============================
 *
 * Login Test (Role-Isolated)
 *
 * Each run only tests ONE role.
 * Role and baseURL are controlled by environment variables:
 *
 * PLAYWRIGHT_BASE_URL
 * TEST_ROLE
 */

const role = process.env.TEST_ROLE as keyof typeof users;

if (!role) {
  throw new Error("❌ TEST_ROLE is not defined");
}

test.describe(`Login Test (${role})`, () => {
  test(`${role} can login successfully`, async ({ page }) => {
    const user = users[role];

    /**
     * Step 1: Login
     */
    await login(page, role, user.email, user.password);

    /**
     * Step 2: Verify not on login page
     */
    await expect(page).not.toHaveURL(/login/);

    /**
     * Step 3: Page loaded
     */
    await page.waitForLoadState("networkidle");

    /**
     * Step 4: Common success check
     */
    await expect(page.locator("header")).toBeVisible();

    /**
     * Step 5: Role-specific validation (lightweight)
     */

    if (role === "candidate") {
      // Candidate may or may not have full profile
      await expect(
        page.getByRole("link", { name: "Job Search", exact: true }),
      ).toBeVisible();
    }

    if (role === "client") {
      await expect(
        page.getByRole("link", { name: /dashboard/i }),
      ).toBeVisible();
    }

    if (role === "admin") {
      await expect(page.getByText(/user management/i)).toBeVisible();
    }

    if (role === "recruiter") {
      await expect(
        page.getByRole("link", { name: /dashboard/i }),
      ).toBeVisible();
    }
  });
});

/**
 * ==========================
 * NEGATIVE TESTS
 * ==========================
 */

/**
 * ============================
 * ❌ LOGIN VALIDATION TESTS
 * ============================
 */
test.describe("Login Validation Tests", () => {
  test("should fail with wrong password", async ({ page }) => {
    await page.goto("/login?role=candidate");

    await page.locator('input[type="email"]').fill(users.candidate.email);
    await page.locator('input[type="password"]').fill("wrongpassword");

    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/login/);
  });

  test("should fail with non-existing user", async ({ page }) => {
    await page.goto("/login?role=candidate");

    await page.locator('input[type="email"]').fill("notexist@test.com");
    await page.locator('input[type="password"]').fill("12345678");

    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/login/);
  });

  test("should fail with empty input", async ({ page }) => {
    await page.goto("/login?role=candidate");

    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText("Email is required")).toBeVisible();
  });
});

/**
 * ============================
 * 🔐 ROLE ISOLATION TESTS
 * ============================
 */
test.describe("Role Isolation Tests", () => {
  test("candidate cannot login to client system", async ({ page }) => {
    await page.goto("/login?role=client");

    await page.locator('input[type="email"]').fill(users.candidate.email);
    await page.locator('input[type="password"]').fill(users.candidate.password);

    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/login/);
  });

  test("client cannot login to admin system", async ({ page }) => {
    await page.goto("/login?role=admin");

    await page.locator('input[type="email"]').fill(users.client.email);
    await page.locator('input[type="password"]').fill(users.client.password);

    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/login/);
  });

  test("recruiter cannot login to candidate system", async ({ page }) => {
    await page.goto("/login?role=candidate");

    await page.locator('input[type="email"]').fill(users.recruiter.email);
    await page.locator('input[type="password"]').fill(users.recruiter.password);

    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/login/);
  });
});
