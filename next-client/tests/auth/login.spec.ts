import { test, expect, type Page } from '@playwright/test';

/**
 * Helper function to perform login.
 * This function navigates to the login page, fills in credentials,
 * and clicks the Sign in button.
 */
async function login(
  page: Page,
  role: 'admin' | 'client' | 'recruiter',
  email: string,
  password: string
) {
  // Navigate to the login page for the selected role
  await page.goto(`/login?role=${role}`);

  // Fill email input
  await page.locator('#email').fill(email);

  // Fill password input
  await page.locator('#password').fill(password);

  // Click the Sign in button
  await page.getByRole('button', { name: /^Sign in$/ }).click();
}

/**
 * Helper function used for debugging when login fails.
 * It prints the current page URL and part of the page text
 * to help diagnose login issues.
 */
async function printLoginDebugInfo(page: Page, label: string) {
  console.log(`\n[DEBUG] ${label}`);
  console.log('[DEBUG] Current URL:', page.url());

  const bodyText = await page.locator('body').innerText().catch(() => '');
  console.log('[DEBUG] Page text snippet:\n', bodyText.slice(0, 1000));
}

/**
 * Test Suite: Authentication - Login
 * This suite verifies that different user roles can log in successfully
 * and that invalid login attempts are handled correctly.
 */
test.describe('Auth - Login', () => {

  /**
   * TC001
   * Verify that an admin user can log in successfully.
   */
  test('TC001 - Admin login', async ({ page }) => {

    // Attempt login using admin credentials
    await login(page, 'admin', 'mason@gmail.com', '1234567890');

    // If login failed and user is still on login page, print debug info
    if (/\/login\?role=admin/i.test(page.url())) {
      await printLoginDebugInfo(page, 'Admin login failed');
    }

    // Expected result: user should leave the login page
    await expect(page).not.toHaveURL(/\/login\?role=admin/i);
  });


  /**
   * TC002
   * Verify that a client user can log in successfully.
   */
  test('TC002 - Client login', async ({ page }) => {

    // Attempt login using client credentials
    await login(page, 'client', 'mike@outlook.com', '1234567890');

    // Print debug information if login fails
    if (/\/login\?role=client/i.test(page.url())) {
      await printLoginDebugInfo(page, 'Client login failed');
    }

    // Expected result: user should leave login page
    await expect(page).not.toHaveURL(/\/login\?role=client/i);
  });


  /**
   * TC003
   * Verify that a recruiter user can log in successfully.
   */
  test('TC003 - Recruiter login', async ({ page }) => {

    // Attempt login using recruiter credentials
    await login(page, 'recruiter', 'tom@outlook.com', '1234567890');

    // Print debug information if login fails
    if (/\/login\?role=recruiter/i.test(page.url())) {
      await printLoginDebugInfo(page, 'Recruiter login failed');
    }

    // Expected result: user should leave login page
    await expect(page).not.toHaveURL(/\/login\?role=recruiter/i);
  });


  /**
   * TC004
   * Verify that login fails when incorrect credentials are used.
   */
  test('TC004 - Login fails with invalid credentials', async ({ page }) => {

    // Step 1: Navigate to client login page
    await page.goto('/login?role=client');

    // Step 2: Enter an invalid email address
    await page.locator('#email').fill('wrong@email.com');

    // Step 3: Enter an invalid password
    await page.locator('#password').fill('wrongpassword');

    // Step 4: Click the Sign in button
    await page.getByRole('button', { name: /^Sign in$/ }).click();

    // Expected result:
    // The user should remain on the login page
    await expect(page).toHaveURL(/\/login\?role=client/i);

    // Verify that an error message is displayed (if implemented)
    await expect(
      page.getByText(/invalid|incorrect|failed|error/i)
    ).toBeVisible();
  });

});