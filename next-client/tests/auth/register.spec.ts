import { test, expect, Page } from "@playwright/test";

/**
 * Register Test Suite (Real API - Candidate Only)
 *
 * Only candidate role supports self-registration.
 * These tests use REAL API calls against deployed backend.
 * Each test generates a unique email to avoid collisions.
 */

// Generate unique test email with timestamp
function generateTestEmail(suffix: string): string {
  const timestamp = Date.now();
  return `e2e-register-${suffix}-${timestamp}@test.com`;
}

async function openRegister(page: Page) {
  await page.goto("/register?role=candidate");
  await expect(
    page.getByRole("heading", { name: /create your account/i }),
  ).toBeVisible();
}

async function fillAndSubmitRegister(
  page: Page,
  input: { email: string; password: string; confirm?: string },
) {
  await page.getByPlaceholder(/you@example\.com/i).fill(input.email);
  await page.getByPlaceholder(/at least 12 characters/i).fill(input.password);
  await page
    .getByPlaceholder(/repeat password/i)
    .fill(input.confirm ?? input.password);

  await page.locator('input[type="checkbox"]').check();
  await page.getByRole("button", { name: /create account/i }).click();
}

test.describe("Register Tests (Real API, Candidate Only)", () => {
  test("@positive candidate register succeeds with real API", async ({
    page,
  }) => {
    const email = generateTestEmail("success");
    const password = "SecurePassword123!";

    await openRegister(page);
    await fillAndSubmitRegister(page, {
      email,
      password,
    });

    // Verify redirected to candidate dashboard
    await expect(page).toHaveURL(/\/candidate/, { timeout: 15000 });

    // Verify header shows candidate UI
    await expect(page.getByRole("link", { name: /job search/i })).toBeVisible({
      timeout: 10000,
    });

    console.log(`✅ Registration successful for: ${email}`);
  });

  test("@negative shows error when email already exists (real collision)", async ({
    page,
  }) => {
    // Use existing candidate's email (already created in fixtures)
    const existingEmail = "tom@outlook.com";
    const password = "SecurePassword123!";

    await openRegister(page);
    await fillAndSubmitRegister(page, {
      email: existingEmail,
      password,
    });

    // Should NOT redirect to candidate dashboard
    await expect(page).not.toHaveURL(/\/candidate$/, { timeout: 10000 });

    // Should show error message
    await expect(
      page.getByText(/email already exists|email already registered/i),
    ).toBeVisible({ timeout: 10000 });

    console.log(`✅ Correctly rejected duplicate email: ${existingEmail}`);
  });

  test("@negative weak password is blocked on client without API call", async ({
    page,
  }) => {
    const email = generateTestEmail("weak-password");
    let registerCallCount = 0;

    // Monitor API calls
    await page.on("request", (request) => {
      if (request.url().includes("/auth/register")) {
        registerCallCount++;
      }
    });

    await openRegister(page);
    await fillAndSubmitRegister(page, {
      email,
      password: "weak",
      confirm: "weak",
    });

    // Should show client-side validation error
    await expect(
      page.getByText(/password must be at least 12 characters/i),
    ).toBeVisible({ timeout: 5000 });

    // API should NOT be called (client-side validation blocked it)
    await page.waitForTimeout(500);
    expect(registerCallCount).toBe(0);

    console.log(`✅ Client-side validation correctly blocked weak password`);
  });

  test("@defect register auto-confirms user but should require email verification", async ({
    page,
  }) => {
    const email = generateTestEmail("auto-confirmed");
    const password = "SecurePassword123!";

    // Capture the login response to check token
    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/auth/register") &&
        res.request().method() === "POST",
    );

    await openRegister(page);
    await fillAndSubmitRegister(page, {
      email,
      password,
    });

    const response = await responsePromise;
    const respBody = await response.json();

    // Defect: Backend auto-activates user (isActive: true) and returns login token
    // This bypasses email verification - user can login immediately without confirming email
    expect(respBody.access_token).toBeTruthy();
    expect(respBody.email).toBe(email);
    expect(respBody.roles).toContain("Candidate");

    // Verify user was auto-logged in (redirected to dashboard)
    await expect(page).toHaveURL(/\/candidate/, { timeout: 15000 });

    console.warn(
      "⚠️  DEFECT DETECTED: New registered users are auto-activated without email verification. This is a security risk for account takeover.",
    );
  });

  test("@positive new user can immediately access authenticated pages after registration (consequence of auto-activation)", async ({
    page,
  }) => {
    const email = generateTestEmail("immediate-access");
    const password = "SecurePassword123!";

    await openRegister(page);
    await fillAndSubmitRegister(page, {
      email,
      password,
    });

    // User is immediately logged in
    await expect(page).toHaveURL(/\/candidate/, { timeout: 15000 });

    // Can access protected page
    await expect(page.getByRole("link", { name: /job search/i })).toBeVisible();

    console.log(
      `✅ New user ${email} has immediate access (auto-activation feature)`,
    );
  });

  /**
   * ============================
   * BOUNDARY TESTS (P0)
   * ============================
   */

  test("@boundary password exactly 12 characters (minimum valid length)", async ({
    page,
  }) => {
    const email = generateTestEmail("password-min-boundary");
    const passwordExactly12 = "Pass1234567!"; // Exactly 12 chars

    await openRegister(page);
    await fillAndSubmitRegister(page, {
      email,
      password: passwordExactly12,
    });

    // Should succeed with exactly 12 characters
    await expect(page).toHaveURL(/\/candidate/, { timeout: 15000 });
    console.log(`✅ Password boundary: 12 chars accepted (minimum valid)`);
  });

  test("@boundary password 11 characters (one below minimum)", async ({
    page,
  }) => {
    const email = generateTestEmail("password-below-min");
    const passwordBelow12 = "Pass123456!"; // 11 chars

    await openRegister(page);
    await fillAndSubmitRegister(page, {
      email,
      password: passwordBelow12,
      confirm: passwordBelow12,
    });

    // Client-side validation should block it
    await expect(
      page.getByText(/password must be at least 12 characters/i),
    ).toBeVisible({ timeout: 5000 });

    console.log(
      `✅ Password boundary: 11 chars correctly rejected (below minimum)`,
    );
  });

  test("@boundary email with special characters (valid format)", async ({
    page,
  }) => {
    const email = `e2e-special.test+${Date.now()}@test.com`; // Special chars allowed
    const password = "SecurePassword123!";

    await openRegister(page);
    await fillAndSubmitRegister(page, {
      email,
      password,
    });

    // Should accept email with special chars like + and .
    await expect(page).toHaveURL(/\/candidate/, { timeout: 15000 });
    console.log(`✅ Email boundary: special chars (+, .) accepted`);
  });

  test("@boundary password confirm field accepts special characters", async ({
    page,
  }) => {
    const email = generateTestEmail("password-special");
    const specialPassword = "Pass!@#$%^&*()123";

    await openRegister(page);
    await page.getByPlaceholder(/you@example\.com/i).fill(email);
    await page
      .getByPlaceholder(/at least 12 characters/i)
      .fill(specialPassword);
    await page.getByPlaceholder(/repeat password/i).fill(specialPassword);

    // Verify both password fields can be filled
    const passwordField = await page
      .getByPlaceholder(/at least 12 characters/i)
      .inputValue();
    const confirmField = await page
      .getByPlaceholder(/repeat password/i)
      .inputValue();

    expect(passwordField).toBe(specialPassword);
    expect(confirmField).toBe(specialPassword);

    console.log(
      `✅ Password boundary: special characters in password fields handled`,
    );
  });
});
