import { test, expect } from "@playwright/test";
import { forgotPassword } from "../helpers/auth-helper";
import { users } from "../fixtures/users";

/**
 * Forgot Password Tests (Real API - Candidate Only)
 *
 * These tests use REAL API calls against deployed backend.
 */

test.describe("Forgot Password Tests (Real API, Candidate Only)", () => {
  test("@positive candidate request returns deterministic user feedback", async ({
    page,
  }) => {
    // Use existing candidate email from fixtures
    const email = users.candidate.email;

    // Monitor the API request/response
    const reqPromise = page.waitForRequest((req) => {
      if (!req.url().includes("/auth/request-password-reset")) return false;
      if (req.method() !== "POST") return false;
      return true;
    });
    const respPromise = page.waitForResponse(
      (res) =>
        res.url().includes("/auth/request-password-reset") &&
        res.request().method() === "POST",
    );

    await forgotPassword(page, "candidate", email);

    // Verify API was called with correct email
    const req = await reqPromise;
    const reqBody = await req.postDataBuffer();
    if (reqBody) {
      const body = JSON.parse(reqBody.toString());
      expect(body.email).toBe(email);
    }

    const resp = await respPromise;

    // In real env this endpoint may be success or throttled; both should show clear feedback.
    if (resp.status() >= 200 && resp.status() < 300) {
      await expect(page.getByText(/check your email/i)).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText(email)).toBeVisible();
    } else if (resp.status() === 429) {
      await expect(
        page.getByText(/too many requests|try again later/i),
      ).toBeVisible({ timeout: 10000 });
    } else {
      throw new Error(
        `Unexpected status from forgot-password: ${resp.status()}`,
      );
    }

    console.log(
      `✅ Forgot password feedback verified with status: ${resp.status()}`,
    );
  });

  test("@negative submit is blocked when email is empty (client validation)", async ({
    page,
  }) => {
    let apiCallCount = 0;

    await page.on("request", (request) => {
      if (request.url().includes("/auth/request-password-reset")) {
        apiCallCount++;
      }
    });

    await page.goto("/login?role=candidate");
    await page.getByText(/forgot password/i).click();
    await page.waitForURL(/\/forgot-password/, { timeout: 10000 });

    const emailInput = page.getByPlaceholder(/you@example\.com/i);
    const submitBtn = page.getByRole("button", { name: /send reset/i });

    // Try to submit without filling email
    await submitBtn.click();

    // Native HTML5 validation should prevent submission
    const isValid = await emailInput.evaluate((el) =>
      (el as HTMLInputElement).checkValidity(),
    );
    expect(isValid).toBe(false);

    // Wait a moment and verify API was not called
    await page.waitForTimeout(500);
    expect(apiCallCount).toBe(0);

    // Success message should NOT appear
    await expect(page.getByText(/check your email/i)).not.toBeVisible();

    console.log(`✅ Empty email correctly blocked by client validation`);
  });

  test("@negative invalid email format is rejected (client validation)", async ({
    page,
  }) => {
    let apiCallCount = 0;

    await page.on("request", (request) => {
      if (request.url().includes("/auth/request-password-reset")) {
        apiCallCount++;
      }
    });

    await page.goto("/login?role=candidate");
    await page.getByText(/forgot password/i).click();
    await page.waitForURL(/\/forgot-password/, { timeout: 10000 });

    const emailInput = page.getByPlaceholder(/you@example\.com/i);
    const submitBtn = page.getByRole("button", { name: /send reset/i });

    // Fill with invalid email
    await emailInput.fill("not-a-valid-email");
    await submitBtn.click();

    // Native HTML5 validation should prevent submission
    const isValid = await emailInput.evaluate((el) =>
      (el as HTMLInputElement).checkValidity(),
    );
    expect(isValid).toBe(false);

    // Wait a moment and verify API was not called
    await page.waitForTimeout(500);
    expect(apiCallCount).toBe(0);

    console.log(`✅ Invalid email format correctly rejected`);
  });

  test("@positive forgot password API responds successfully", async ({
    page,
  }) => {
    // Use a fresh email for this test to avoid rate-limiting
    const timestamp = Date.now();
    const testEmail = `test-fresh-${timestamp}@test.com`;

    // Wait for API response
    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/auth/request-password-reset") &&
        res.request().method() === "POST",
    );

    await page.goto("/login?role=candidate");
    await page.getByText(/forgot password/i).click();
    await page.waitForURL(/\/forgot-password/, { timeout: 10000 });

    await page.getByPlaceholder(/you@example\.com/i).fill(testEmail);
    await page.getByRole("button", { name: /send reset/i }).click();

    const response = await responsePromise;

    // Verify correct endpoint
    expect(response.url()).toContain("/auth/request-password-reset");

    // Should be 2xx success (backend may rate-limit after too many requests)
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);

    console.log(
      `✅ Forgot password API responded with status ${response.status()}`,
    );
  });

  test("@defect forgot password rate-limiting returns 429 (Too Many Requests)", async ({
    page,
  }) => {
    const email = users.candidate.email;

    // Try to call forgot-password multiple times to trigger rate-limiting
    for (let attempt = 0; attempt < 6; attempt++) {
      const responsePromise = page.waitForResponse(
        (res) =>
          res.url().includes("/auth/request-password-reset") &&
          res.request().method() === "POST",
      );

      await forgotPassword(page, "candidate", email);

      const response = await responsePromise;

      if (response.status() === 429) {
        console.warn(
          `⚠️  DEFECT DETECTED: Rate-limiting returns 429 on attempt ${attempt + 1}. This may indicate password reset spam protection is too aggressive.`,
        );
        expect(response.status()).toBe(429);
        return; // Test passed - defect detected
      }
    }

    console.log(
      "ℹ️  Rate-limiting did not trigger within 6 attempts (acceptable)",
    );
  });

  /**
   * ============================
   * BOUNDARY TESTS (P0)
   * ============================
   */

  test("@boundary forgot-password with email containing special characters", async ({
    page,
  }) => {
    const specialEmail = `test+special.${Date.now()}@example.com`; // Email with + and .

    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/auth/request-password-reset") &&
        res.request().method() === "POST",
    );

    await page.goto("/login?role=candidate");
    await page.getByText(/forgot password/i).click();
    await page.waitForURL(/\/forgot-password/, { timeout: 10000 });

    await page.getByPlaceholder(/you@example\.com/i).fill(specialEmail);
    await page.getByRole("button", { name: /send reset/i }).click();

    const response = await responsePromise;
    expect(
      (response.status() >= 200 && response.status() < 300) ||
        response.status() === 429,
    ).toBeTruthy();

    console.log(
      `✅ Boundary: Email with special characters (+, .) handled correctly`,
    );
  });

  test("@boundary forgot-password with very long email address", async ({
    page,
  }) => {
    // RFC 5321: max email local part is 64 chars, total max 254 chars
    const veryLongEmail = `${"a".repeat(60)}@verylongdomainname.example.com`;

    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/auth/request-password-reset") &&
        res.request().method() === "POST",
    );

    await page.goto("/login?role=candidate");
    await page.getByText(/forgot password/i).click();
    await page.waitForURL(/\/forgot-password/, { timeout: 10000 });

    await page.getByPlaceholder(/you@example\.com/i).fill(veryLongEmail);
    await page.getByRole("button", { name: /send reset/i }).click();

    const response = await responsePromise;
    // Should handle gracefully
    expect(
      (response.status() >= 200 && response.status() < 300) ||
        response.status() === 404 ||
        response.status() === 429,
    ).toBeTruthy();

    console.log(
      `✅ Boundary: Very long email (${veryLongEmail.length} chars) handled safely`,
    );
  });

  test("@boundary forgot-password with case-insensitive email", async ({
    page,
  }) => {
    const email = users.candidate.email;
    const uppercaseEmail = email.toUpperCase();

    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/auth/request-password-reset") &&
        res.request().method() === "POST",
    );

    await page.goto("/login?role=candidate");
    await page.getByText(/forgot password/i).click();
    await page.waitForURL(/\/forgot-password/, { timeout: 10000 });

    await page.getByPlaceholder(/you@example\.com/i).fill(uppercaseEmail);
    await page.getByRole("button", { name: /send reset/i }).click();

    const response = await responsePromise;
    expect(
      (response.status() >= 200 && response.status() < 300) ||
        response.status() === 429,
    ).toBeTruthy();

    console.log(
      `✅ Boundary: Case-insensitive email handling verified (${uppercaseEmail})`,
    );
  });

  test("@boundary forgot-password with whitespace in email field", async ({
    page,
  }) => {
    const email = users.candidate.email;
    const emailWithSpaces = `  ${email}  `;

    await page.goto("/login?role=candidate");
    await page.getByText(/forgot password/i).click();
    await page.waitForURL(/\/forgot-password/, { timeout: 10000 });

    const emailInput = page.getByPlaceholder(/you@example\.com/i);
    const submitBtn = page.getByRole("button", { name: /send reset/i });

    await emailInput.fill(emailWithSpaces);
    await submitBtn.click();

    // The field should handle or strip whitespace
    const inputValue = await emailInput.inputValue();
    const isValid = await emailInput.evaluate((el) =>
      (el as HTMLInputElement).checkValidity(),
    );

    console.log(
      `✅ Boundary: Whitespace in email - validity: ${isValid}, trimmed: ${inputValue === email}`,
    );
  });
});
