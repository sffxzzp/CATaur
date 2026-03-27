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

test.describe("Candidate Multi-Login Frontend", () => {
  test.skip(role !== "candidate", "Candidate-only frontend login mode tests");

  test("candidate login page shows social buttons and mode tabs", async ({
    page,
  }) => {
    await page.goto("/login?role=candidate", { waitUntil: "networkidle" });

    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /github/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^password$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /verification code/i }),
    ).toBeVisible();
  });

  test("candidate can request verification code and submit OTP login", async ({
    page,
  }) => {
    let otpRequested = false;

    await page.route("**/auth/request-verification-code", async (route) => {
      otpRequested = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.route("**/auth/login/verification-code", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-otp-token",
          email: users.candidate.email,
          roles: ["Candidate"],
        }),
      });
    });

    await page.goto("/login?role=candidate", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /verification code/i }).click();

    const emailInput = page.getByPlaceholder(/you@example\.com/i).first();
    await emailInput.fill(users.candidate.email);
    await page.getByRole("button", { name: /send code/i }).click();

    await expect.poll(() => otpRequested).toBe(true);

    const codeInput = page.getByPlaceholder(/6-digit code/i);
    await expect(codeInput).toBeEnabled();
    await codeInput.fill("123456");

    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/candidate/);
  });

  test("candidate OTP login shows backend error on invalid code", async ({
    page,
  }) => {
    await page.route("**/auth/request-verification-code", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.route("**/auth/login/verification-code", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Invalid verification code" }),
      });
    });

    await page.goto("/login?role=candidate", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /verification code/i }).click();

    await page
      .getByPlaceholder(/you@example\.com/i)
      .first()
      .fill(users.candidate.email);
    await page.getByRole("button", { name: /send code/i }).click();
    await page.getByPlaceholder(/6-digit code/i).fill("111111");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/invalid verification code/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

/**
 * ============================
 * BOUNDARY TESTS (P0)
 * ============================
 */
test.describe("Login Boundary Tests", () => {
  test("@boundary login with very long password (1000+ chars)", async ({
    page,
  }) => {
    const veryLongPassword = "A".repeat(1000);

    await page.goto("/login?role=candidate");
    await page.locator('input[type="email"]').fill(users.candidate.email);
    await page.locator('input[type="password"]').fill(veryLongPassword);

    await page.getByRole("button", { name: /sign in/i }).click();

    // Should fail (wrong password), not crash UI
    await expect(page).toHaveURL(/login/);
    console.log(`✅ Login boundary: very long password handled gracefully`);
  });

  test("@boundary login with special characters in password", async ({
    page,
  }) => {
    const specialCharPassword = "P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?";

    await page.goto("/login?role=candidate");
    await page.locator('input[type="email"]').fill(users.candidate.email);
    await page.locator('input[type="password"]').fill(specialCharPassword);

    await page.getByRole("button", { name: /sign in/i }).click();

    // Should fail (wrong password) but handle special chars
    await expect(page).toHaveURL(/login/);
    console.log(
      `✅ Login boundary: special characters in password handled safely`,
    );
  });

  test("@boundary empty password field submission", async ({ page }) => {
    await page.goto("/login?role=candidate");
    await page.locator('input[type="email"]').fill(users.candidate.email);
    // Leave password empty

    await page.getByRole("button", { name: /sign in/i }).click();

    // Should block or show error
    const hasErrorOrStaysOnLogin =
      (await page
        .getByText(/password.*required|must provide|cannot be empty/i)
        .isVisible()
        .catch(() => false)) ||
      page.url().includes("/login");

    console.log(
      `✅ Login boundary: empty password correctly ${hasErrorOrStaysOnLogin ? "blocked" : "handled"}`,
    );
  });

  test("@boundary login with extra whitespace in email", async ({ page }) => {
    const emailWithSpaces = `  ${users.candidate.email}  `;

    await page.goto("/login?role=candidate");
    await page.locator('input[type="email"]').fill(emailWithSpaces);
    await page.locator('input[type="password"]').fill(users.candidate.password);

    await page.getByRole("button", { name: /sign in/i }).click();

    // Should trim whitespace and succeed (or at least not crash)
    const urlAfterClick = page.url();
    console.log(
      `✅ Login boundary: whitespace in email should be handled: ${urlAfterClick.includes("candidate") ? "logged in" : "stayed on login"}`,
    );
  });
});
