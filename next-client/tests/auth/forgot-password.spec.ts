import { test, expect, type Page } from '@playwright/test';

/**
 * Navigate to the Forgot Password page from the login page.
 * This function opens the login page, clicks the "Forgot Password?" link,
 * and verifies that the user is redirected to the reset password page.
 */
async function goToForgotPassword(page: Page) {
  // Open the candidate login page
  await page.goto('/login?role=candidate');

  // Click the "Forgot Password?" link
  await page.getByText(/forgot password\?/i).click();

  // Verify the page URL changed to forgot/reset password page
  await expect(page).toHaveURL(/forgot-password|reset-password/i);

  // Verify the page title is visible
  await expect(
    page.getByRole('heading', { name: /forgot password\?/i })
  ).toBeVisible();
}

test.describe('Auth - Forgot Password', () => {

  /**
   * TC-FORGOT-001
   * Verify that the user can open the forgot password page
   * and see the required UI elements.
   */
  test('TC-FORGOT-001 - User can open forgot password page', async ({ page }) => {
    await goToForgotPassword(page);

    // Check the instruction text
    await expect(
      page.getByText(/enter your email and we'll send you a reset link/i)
    ).toBeVisible();

    // Verify email input field is visible
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();

    // Verify submit button is visible
    await expect(
      page.getByRole('button', { name: /send reset link/i })
    ).toBeVisible();
  });

  /**
   * TC-FORGOT-002
   * Verify that the form cannot be submitted when the email field is empty.
   */
  test('TC-FORGOT-002 - Empty email cannot be submitted', async ({ page }) => {
    await goToForgotPassword(page);

    const emailInput = page.getByPlaceholder('you@example.com');
    const submitBtn = page.getByRole('button', { name: /send reset link/i });

    // Click submit without entering email
    await submitBtn.click();

    // Because the field uses HTML "required",
    // the form should not proceed to the success state
    await expect(
      page.getByRole('heading', { name: /forgot password\?/i })
    ).toBeVisible();

    // Success message should not appear
    await expect(
      page.getByRole('heading', { name: /check your email/i })
    ).not.toBeVisible();

    // Email input should still be visible
    await expect(emailInput).toBeVisible();
  });

  /**
   * TC-FORGOT-003
   * Verify that an invalid email format cannot be submitted.
   */
  test('TC-FORGOT-003 - Invalid email format cannot be submitted', async ({ page }) => {
    await goToForgotPassword(page);

    const emailInput = page.getByPlaceholder('you@example.com');
    const submitBtn = page.getByRole('button', { name: /send reset link/i });

    // Enter an invalid email format
    await emailInput.fill('invalid-email');

    // Attempt to submit
    await submitBtn.click();

    // Because the browser uses built-in email validation,
    // the page should stay on the same form
    await expect(
      page.getByRole('heading', { name: /forgot password\?/i })
    ).toBeVisible();

    // Success page should not appear
    await expect(
      page.getByRole('heading', { name: /check your email/i })
    ).not.toBeVisible();

    // Email input should still be visible
    await expect(emailInput).toBeVisible();
  });

  /**
   * TC-FORGOT-004
   * Verify that a user can successfully submit a forgot password request
   * with a valid email address.
   */
  test('TC-FORGOT-004 - User can submit forgot password request with valid email', async ({ page }) => {
    await goToForgotPassword(page);

    const emailInput = page.getByPlaceholder('you@example.com');
    const submitBtn = page.getByRole('button', { name: /send reset link/i });

    // Enter a valid email address
    await emailInput.fill('you@example.com');

    // Submit the form
    await submitBtn.click();

    // Verify success message is displayed
    await expect(
      page.getByRole('heading', { name: /check your email/i })
    ).toBeVisible();

    // Verify reset email instruction text appears
    await expect(
      page.getByText(/we sent a password reset link to/i)
    ).toBeVisible();

    // Verify the email address is displayed on the page
    await expect(page.getByText('you@example.com')).toBeVisible();

    // Verify the "Back to Sign In" link is visible
    await expect(
      page.getByRole('link', { name: /back to sign in/i })
    ).toBeVisible();
  });

});