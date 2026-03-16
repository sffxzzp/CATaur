// Import Playwright test framework
import { test, expect, type Page } from '@playwright/test';

// Define available user roles
type Role = 'recruiter' | 'client' | 'candidate';

// Test account information for each role
// Includes login credentials, home page URL, and protected page path
const accounts: Record<Role, { email: string; password: string; homeUrl: RegExp; protectedPath: string }> = {

  // Recruiter account
  // After login, the user should be redirected to /recruiter
  recruiter: {
    email: 'allan@cataur.com',
    password: '123',
    homeUrl: /\/recruiter\/?$/,
    protectedPath: '/recruiter',
  },

  // Client account
  client: {
    email: 'client@example.com',
    password: '123',
    homeUrl: /\/client\/?$/,
    protectedPath: '/client',
  },

  // Candidate account
  candidate: {
    email: 'allan@cataur.com',
    password: '123',
    homeUrl: /\/candidate\/?$/,
    protectedPath: '/candidate',
  },
};

/**
 * Login helper function.
 * Opens the login page for a specific role and performs login.
 */
async function loginAs(page: Page, role: Role) {

  // Navigate to the login page for the selected role
  await page.goto(`/login?role=${role}`);

  // Enter email
  await page.locator('#email').fill(accounts[role].email);

  // Enter password
  await page.locator('#password').fill(accounts[role].password);

  // Click the "Sign in" button
  await page.getByRole('button', { name: /^Sign in$/ }).click();

  // Verify user is redirected to the correct home page
  await expect(page).toHaveURL(accounts[role].homeUrl);
}

/**
 * Open the user menu in the top-right corner.
 * The menu usually appears when clicking the avatar icon.
 */
async function openUserMenu(page: Page) {

  // Try to find avatar buttons with text like AR / CC / A
  const avatarByText = page.locator('button:visible').filter({ hasText: /^[A-Z]{1,3}$/ }).last();

  if (await avatarByText.count()) {
    // Click the avatar button
    await avatarByText.click();
  } else {

    // Fallback method:
    // Click the last visible button in the header (usually the avatar)
    const btns = page.locator('header button:visible');
    const n = await btns.count();
    await btns.nth(n - 1).click();
  }
}

/**
 * Logout helper function.
 * Opens the user menu and clicks the logout option.
 */
async function logout(page: Page) {

  // Open the user menu
  await openUserMenu(page);

  // Support different logout text options:
  // "Log out", "Logout", or "Sign out"
  const logoutItem = page.getByText(/log\s*out|logout|sign\s*out/i).first();

  // Ensure the logout button is visible before clicking
  await expect(logoutItem).toBeVisible({ timeout: 8000 });

  // Click logout
  await logoutItem.click();

  // Verify the user is redirected to the login page
  await expect(page).toHaveURL(/\/login/);
}

// Test suite for logout functionality
test.describe('Auth - Logout (3 roles)', () => {

  /**
   * TC-LOGOUT-RECRUITER
   * Verify recruiter can logout and cannot access protected pages.
   */
  test('TC-LOGOUT-RECRUITER - Recruiter can logout and is blocked', async ({ page }) => {

    // Login as recruiter
    await loginAs(page, 'recruiter');

    // Perform logout
    await logout(page);

    // Try to access protected recruiter page
    await page.goto(accounts.recruiter.protectedPath);

    // Verify user is redirected back to login page
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-LOGOUT-CLIENT
   * Verify client can logout and cannot access protected pages.
   */
  test('TC-LOGOUT-CLIENT - Client can logout and is blocked', async ({ page }) => {

    // Login as client
    await loginAs(page, 'client');

    // Logout
    await logout(page);

    // Attempt to access client dashboard again
    await page.goto(accounts.client.protectedPath);

    // Verify access is blocked and redirected to login
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-LOGOUT-CANDIDATE
   * Verify candidate can logout and cannot access protected pages.
   */
  test('TC-LOGOUT-CANDIDATE - Candidate can logout and is blocked', async ({ page }) => {

    // Login as candidate
    await loginAs(page, 'candidate');

    // Logout
    await logout(page);

    // Attempt to open candidate page again
    await page.goto(accounts.candidate.protectedPath);

    // Verify user is redirected to login page
    await expect(page).toHaveURL(/\/login/);
  });

});