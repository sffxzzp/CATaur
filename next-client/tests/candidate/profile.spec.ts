// Import Playwright testing functions
import { test, expect, type Page } from '@playwright/test';

/**
 * Helper function: Login as candidate user
 * Steps:
 * 1. Open candidate login page
 * 2. Enter email and password
 * 3. Click Sign in
 * 4. Verify redirect to candidate dashboard
 */
async function loginAsCandidate(page: Page) {

  // Navigate to candidate login page
  await page.goto('/login?role=candidate');

  // Enter candidate credentials
  await page.locator('#email').fill('tester1@bug.com');
  await page.locator('#password').fill('123');

  // Click login button
  await page.getByRole('button', { name: /^Sign in$/ }).click();

  // Verify successful login
  await expect(page).toHaveURL(/\/candidate/i);
}

/**
 * Helper function: Navigate to Profile page
 * Steps:
 * 1. Login as candidate
 * 2. Click Profile link in navigation
 * 3. Verify Profile page is loaded
 */
async function goToProfile(page: Page) {

  // Login first
  await loginAsCandidate(page);

  // Open Profile page
  await page.getByRole('link', { name: /^Profile$/i }).click();

  // Verify profile page URL
  await expect(page).toHaveURL(/\/candidate\/profile/i);

  // Verify profile build page text
  await expect(page.getByText(/build your profile/i)).toBeVisible();
}

// Test suite for Candidate Profile page
test.describe('Candidate - Profile', () => {

  /**
   * TC-CAND-PROF-001
   * Verify that candidate can open the profile page.
   */
  test('TC-CAND-PROF-001 - Candidate can open profile page', async ({ page }) => {

    // Navigate to profile page
    await goToProfile(page);

    // Verify profile page content
    await expect(page.getByText(/build your profile/i)).toBeVisible();
  });

  /**
   * TC-CAND-PROF-002
   * Verify that candidate can see the "Upload Resume" action.
   */
  test('TC-CAND-PROF-002 - Candidate can see upload resume action', async ({ page }) => {

    // Open profile page
    await goToProfile(page);

    // Verify upload resume button is visible
    await expect(
      page.getByRole('button', { name: /upload resume/i })
    ).toBeVisible();
  });

  /**
   * TC-CAND-PROF-003
   * Verify that candidate can see the option to skip resume
   * and fill the profile manually.
   */
  test('TC-CAND-PROF-003 - Candidate can see skip manual option', async ({ page }) => {

    // Open profile page
    await goToProfile(page);

    // Verify skip manual option is visible
    await expect(
      page.getByText(/skip and fill manually/i)
    ).toBeVisible();
  });

  /**
   * TC-CAND-PROF-004
   * Verify that candidate can click "Skip and fill manually"
   * to continue building the profile manually.
   */
  test('TC-CAND-PROF-004 - Candidate can click skip and fill manually', async ({ page }) => {

    // Open profile page
    await goToProfile(page);

    // Click skip manual option
    await page.getByText(/skip and fill manually/i).click();

    // Verify next profile section appears
    await expect(
      page.getByText(/profile|personal|experience|education|skills/i).first()
    ).toBeVisible();
  });

});