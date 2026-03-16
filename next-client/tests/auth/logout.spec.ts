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
 * Helper function used for debugging.
 * It prints the current page URL and part of the page text.
 */
async function printDebugInfo(page: Page, label: string) {
  console.log(`\n[DEBUG] ${label}`);
  console.log('[DEBUG] Current URL:', page.url());

  const bodyText = await page.locator('body').innerText().catch(() => '');
  console.log('[DEBUG] Page text snippet:\n', bodyText.slice(0, 1000));
}

/**
 * Helper function to login and verify success.
 */
async function loginAndVerify(
  page: Page,
  role: 'admin' | 'client' | 'recruiter',
  email: string,
  password: string
) {
  // Perform login
  await login(page, role, email, password);

  // If login failed and user is still on login page, print debug info
  if (new RegExp(`/login\\?role=${role}`, 'i').test(page.url())) {
    await printDebugInfo(page, `${role} login failed`);
  }

  // Expected result: user should leave the login page
  await expect(page).not.toHaveURL(new RegExp(`/login\\?role=${role}`, 'i'));
}

/**
 * Helper function to open the user menu.
 */
async function openUserMenu(page: Page) {
  // Try avatar button with initials
  const avatarButton = page
    .locator('button:visible')
    .filter({ hasText: /^[A-Z]{1,3}$/ })
    .last();

  if ((await avatarButton.count()) > 0) {
    await avatarButton.click();
    return;
  }

  // Try common buttons in header
  const headerButtons = page.locator('header button:visible');
  const count = await headerButtons.count();

  if (count > 0) {
    await headerButtons.nth(count - 1).click();
    return;
  }

  // Try accessible button names
  const menuButton = page.getByRole('button', {
    name: /profile|account|menu|user|avatar/i,
  });

  if ((await menuButton.count()) > 0) {
    await menuButton.first().click();
    return;
  }

  await printDebugInfo(page, 'User menu button not found');
  throw new Error('Could not find user menu button.');
}

/**
 * Helper function to perform logout.
 */
async function logout(page: Page) {
  // Open user menu
  await openUserMenu(page);

  // Click logout item
  const logoutItem = page.getByText(/log\s*out|logout|sign\s*out/i).first();
  await expect(logoutItem).toBeVisible({ timeout: 8000 });
  await logoutItem.click();

  // If logout failed, print debug info
  if (!/\/login/i.test(page.url())) {
    await printDebugInfo(page, 'Logout may have failed');
  }

  // Expected result: user should be redirected to login page
  await expect(page).toHaveURL(/\/login/i);
}

/**
 * Test Suite: Authentication - Logout
 * This suite verifies that different user roles can log out successfully.
 */
test.describe('Auth - Logout', () => {

  /**
   * TC001
   * Verify that an admin user can log out successfully.
   * Note: /admin is publicly accessible, so route blocking is not tested here.
   */
  test('TC001 - Admin can logout successfully', async ({ page }) => {

    // Step 1: Login as admin
    await loginAndVerify(page, 'admin', 'mason@gmail.com', '1234567890');

    // Step 2: Perform logout
    await logout(page);

    // Expected result: user should be redirected to login page
    await expect(page).toHaveURL(/\/login/i);
  });

  /**
   * TC002
   * Verify that a client user can log out successfully
   * and cannot access protected pages after logout.
   */
  test('TC002 - Client can logout and is blocked', async ({ page }) => {

    // Step 1: Login as client
    await loginAndVerify(page, 'client', 'mike@outlook.com', '1234567890');

    // Step 2: Perform logout
    await logout(page);

    // Step 3: Try to access protected client page again
    await page.goto('/client');

    // Expected result: user should be redirected to login page
    await expect(page).toHaveURL(/\/login/i);
  });

  /**
   * TC003
   * Verify that a recruiter user can log out successfully
   * and cannot access protected pages after logout.
   */
  test('TC003 - Recruiter can logout and is blocked', async ({ page }) => {

    // Step 1: Login as recruiter
    await loginAndVerify(page, 'recruiter', 'tom@outlook.com', '1234567890');

    // Step 2: Perform logout
    await logout(page);

    // Step 3: Try to access protected recruiter page again
    await page.goto('/recruiter');

    // Expected result: user should be redirected to login page
    await expect(page).toHaveURL(/\/login/i);
  });

});