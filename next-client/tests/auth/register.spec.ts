// Import Playwright test utilities
import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Generate a unique email address for each test run.
 * This helps avoid conflicts when creating test accounts repeatedly.
 */
function uniqueEmail(prefix = 'e2e.candidate') {
  return `${prefix}.${Date.now()}@example.com`;
}

/**
 * Print page debug info to help diagnose failures.
 */
async function printRegisterDebugInfo(page: Page, label: string) {
  console.log(`\n[DEBUG] ${label}`);
  console.log('[DEBUG] Current URL:', page.url());

  const bodyText = await page.locator('body').innerText().catch(() => '');
  console.log('[DEBUG] Page text snippet:\n', bodyText.slice(0, 1200));
}

/**
 * Find the entry used to open candidate self-registration.
 * This helper tries several common locator strategies.
 */
async function getCreateOneEntry(page: Page): Promise<Locator> {
  const candidates: Locator[] = [
    page.getByRole('button', { name: /create one|sign up|register|create account/i }).first(),
    page.getByRole('link', { name: /create one|sign up|register|create account/i }).first(),
    page.getByText(/create one|sign up|register|create account/i).first(),
  ];

  for (const locator of candidates) {
    if (await locator.count()) {
      return locator;
    }
  }

  return page.locator('__not_found__');
}

/**
 * Navigate to the Candidate Register page.
 *
 * Flow:
 * 1. Open candidate login page
 * 2. Click the registration entry
 * 3. Verify the registration page is displayed
 */
async function goToCandidateRegister(page: Page) {
  // Step 1: Open candidate login page
  await page.goto('/login?role=candidate');

  // Step 2: Find the registration entry
  const createOne = await getCreateOneEntry(page);

  if (!(await createOne.count())) {
    await printRegisterDebugInfo(page, 'Create one / register entry not found');
  }

  await expect(createOne).toBeVisible({ timeout: 8000 });
  await createOne.click();

  // Step 3: Verify the register page heading is visible
  await expect(
    page.getByRole('heading', { name: /create your account|register|sign up/i })
  ).toBeVisible({ timeout: 8000 });
}

/**
 * Fill the candidate registration form.
 */
async function fillRegisterForm(
  page: Page,
  email: string,
  password: string,
  confirmPassword: string
) {
  // Fill email field
  await page.getByPlaceholder('you@example.com').fill(email);

  // Fill password field
  await page.getByPlaceholder(/at least 8 characters/i).fill(password);

  // Fill confirm password field
  await page.getByPlaceholder(/repeat password/i).fill(confirmPassword);

  // Accept terms and conditions
  await page.getByRole('checkbox').check();
}

/**
 * Test Suite: Authentication - Candidate Register
 * This suite verifies that candidate self-registration works correctly.
 */
test.describe('Auth - Candidate Register', () => {
  /**
   * TC-REG-001
   * Verify that a candidate can successfully create an account.
   */
  test('TC-REG-001 - Candidate can create account (self-register)', async ({ page }) => {
    // Generate a unique test email
    const email = uniqueEmail();
    const password = 'Password123!';

    // Navigate to candidate register page
    await goToCandidateRegister(page);

    // Fill registration form with valid data
    await fillRegisterForm(page, email, password, password);

    // Click Create Account
    await page.getByRole('button', { name: /create account/i }).click();

    // Expected result:
    // User should leave the registration page
    await expect(page).not.toHaveURL(/register/i);

    // The register heading should no longer be visible
    await expect(
      page.getByRole('heading', { name: /create your account|register|sign up/i })
    ).not.toBeVisible();

    // A success or next-step text should appear
    await expect(
      page.getByText(/sign in|login|check your email|welcome/i).first()
    ).toBeVisible();
  });

  /**
   * TC-REG-002
   * Verify that registration fails when passwords do not match.
   */
  test('TC-REG-002 - Candidate register validation: passwords mismatch', async ({ page }) => {
    // Generate a unique test email
    const email = uniqueEmail('e2e.mismatch');

    // Navigate to candidate register page
    await goToCandidateRegister(page);

    // Fill the form with mismatched passwords
    await fillRegisterForm(page, email, 'Password123!', 'Password123!!');

    // Submit registration
    await page.getByRole('button', { name: /create account/i }).click();

    // Expected result:
    // Validation message should be displayed
    await expect(
      page.getByText(/^Passwords do not match\.$/)
    ).toBeVisible();

    // User should remain on the registration page
    await expect(
      page.getByRole('heading', { name: /create your account|register|sign up/i })
    ).toBeVisible();
  });
});