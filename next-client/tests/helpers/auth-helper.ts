import { expect, type Page } from '@playwright/test';

/**
 * Helper function to perform login.
 * This function navigates to the login page, fills in credentials,
 * and clicks the Sign in button.
 */
export async function login(
  page: Page,
  role: 'admin' | 'client' | 'recruiter' | 'candidate',
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
 */
export async function printLoginDebugInfo(page: Page, label: string) {

  console.log(`\n[DEBUG] ${label}`);
  console.log('[DEBUG] Current URL:', page.url());

  const bodyText = await page.locator('body').innerText().catch(() => '');

  console.log('[DEBUG] Page text snippet:\n', bodyText.slice(0, 1000));

}