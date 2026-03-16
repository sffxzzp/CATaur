// Import Playwright testing functions
import { test, expect, type Page } from '@playwright/test';

/**
 * Helper function: Login as candidate
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
 * 2. Click Profile in navigation menu
 * 3. Verify profile page is displayed
 */
async function goToProfile(page: Page) {

  // Login first
  await loginAsCandidate(page);

  // Click Profile link
  await page.getByRole('link', { name: /^Profile$/i }).click();

  // Verify profile page URL
  await expect(page).toHaveURL(/\/candidate\/profile/i);

  // Verify profile build page text
  await expect(page.getByText(/build your profile/i)).toBeVisible();
}

// Test suite for candidate profile building flow
test.describe('Candidate - Profile Flow', () => {

  /**
   * TC-CAND-PROF-FLOW-001
   * Verify that candidate can open the profile build page.
   */
  test('TC-CAND-PROF-FLOW-001 - Candidate can open build profile page', async ({ page }) => {

    // Navigate to profile page
    await goToProfile(page);

    // Verify profile page elements
    await expect(page.getByText(/build your profile/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /upload resume/i })).toBeVisible();
    await expect(page.getByText(/skip and fill manually/i)).toBeVisible();
  });

  /**
   * TC-CAND-PROF-FLOW-002
   * Verify that candidate can open the Basic Information step.
   */
  test('TC-CAND-PROF-FLOW-002 - Candidate can open Basic Information step', async ({ page }) => {

    // Navigate to profile page
    await goToProfile(page);

    // Locate the "Skip and fill manually" option
    const skipManual =
      page.getByRole('button', { name: /skip and fill manually/i })
        .or(page.getByRole('link', { name: /skip and fill manually/i }))
        .or(page.getByText(/skip and fill manually/i).first());

    // Click skip to manually enter profile information
    await expect(skipManual).toBeVisible();
    await skipManual.click();

    // Verify Basic Information section appears
    await expect(
      page.getByText(/basic information|first name|last name|email address|phone number/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  /**
   * TC-CAND-PROF-FLOW-003
   * Verify that candidate can see all Basic Information form fields.
   */
  test('TC-CAND-PROF-FLOW-003 - Candidate can see Basic Information form fields', async ({ page }) => {

    // Navigate to profile page
    await goToProfile(page);

    // Skip resume upload and enter manual profile setup
    const skipManual =
      page.getByRole('button', { name: /skip and fill manually/i })
        .or(page.getByRole('link', { name: /skip and fill manually/i }))
        .or(page.getByText(/skip and fill manually/i).first());

    await skipManual.click();

    // Verify basic profile fields
    await expect(page.getByText(/first name/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/last name/i)).toBeVisible();
    await expect(page.getByText(/email address/i)).toBeVisible();
    await expect(page.getByText(/phone number/i)).toBeVisible();
    await expect(page.getByText(/country/i)).toBeVisible();
    await expect(page.getByText(/province|state/i)).toBeVisible();
    await expect(page.getByText(/city/i)).toBeVisible();

    // Verify continue button exists
    await expect(
      page.getByRole('button', { name: /continue to resume/i })
    ).toBeVisible();
  });

  /**
   * TC-CAND-PROF-FLOW-004
   * Verify candidate can continue from Basic Information to Resume step.
   */
  test('TC-CAND-PROF-FLOW-004 - Candidate can continue to resume step', async ({ page }) => {

    // Navigate to profile page
    await goToProfile(page);

    // Skip manual profile entry
    const skipManual =
      page.getByRole('button', { name: /skip and fill manually/i })
        .or(page.getByRole('link', { name: /skip and fill manually/i }))
        .or(page.getByText(/skip and fill manually/i).first());

    await skipManual.click();

    // Click continue button
    const continueBtn = page.getByRole('button', { name: /continue to resume/i });
    await expect(continueBtn).toBeVisible({ timeout: 10000 });
    await continueBtn.click();

    // Verify resume upload step appears
    await expect(
      page.getByText(/upload resume|click to browse or drag and drop/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  /**
   * TC-CAND-PROF-FLOW-005
   * Verify candidate can skip the resume upload step.
   */
  test('TC-CAND-PROF-FLOW-005 - Candidate can skip resume step', async ({ page }) => {

    // Navigate to profile page
    await goToProfile(page);

    // Skip manual profile setup
    const skipManual =
      page.getByRole('button', { name: /skip and fill manually/i })
        .or(page.getByRole('link', { name: /skip and fill manually/i }))
        .or(page.getByText(/skip and fill manually/i).first());

    await skipManual.click();

    // Move to resume step
    const continueBtn = page.getByRole('button', { name: /continue to resume/i });
    await expect(continueBtn).toBeVisible({ timeout: 10000 });
    await continueBtn.click();

    // Skip resume upload
    const skipResume = page.getByRole('button', { name: /skip this step/i });
    await expect(skipResume).toBeVisible({ timeout: 10000 });
    await skipResume.click();

    // Verify resume upload section is no longer visible
    await expect(
      page.getByText(/upload resume/i)
    ).not.toBeVisible();
  });

});