import { test, expect } from "@playwright/test";
import { forgotPassword } from "../helpers/auth-helper";

test.describe("Forgot Password Tests (Candidate Only)", () => {
  test("candidate can request password reset", async ({ page }) => {
    const email = "test_candidate@test.com";

    await forgotPassword(page, "candidate", email);

    // ✅ check page message
    await expect(page.getByText(/check your email/i)).toBeVisible();

    // ✅ check if email is shown on the page
    await expect(page.getByText(email)).toBeVisible();

    // ✅ check action button text
    await expect(page.getByText(/open email app/i)).toBeVisible();
  });
});

test("forgot password triggers API", async ({ page }) => {
  const email = "test_candidate@test.com";

  // wait for API request
  const responsePromise = page.waitForResponse((res) =>
    res.url().includes("/forgot-password"),
  );

  await forgotPassword(page, "candidate", email);

  // check API response status
  const response = await responsePromise;
  expect(response.status()).toBe(200);
});
