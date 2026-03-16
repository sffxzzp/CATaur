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

  // Click the login button
  await page.getByRole('button', { name: /^Sign in$/ }).click();

  // Verify login success by checking candidate dashboard URL
  await expect(page).toHaveURL(/\/candidate/i);
}

/**
 * Helper function: Navigate to candidate Home page
 * Steps:
 * 1. Login as candidate
 * 2. Click Home in navigation menu
 * 3. Verify Home page is displayed
 */
async function goToHome(page: Page) {

  // Login first
  await loginAsCandidate(page);

  // Click Home link in navigation
  await page.getByRole('link', { name: /^Home$/i }).click();

  // Verify URL is the candidate home page
  await expect(page).toHaveURL(/\/candidate$/i);

  // Verify welcome message appears
  await expect(page.getByText(/welcome to cataur/i)).toBeVisible();
}

// Test suite for Candidate Home page
test.describe('Candidate - Home', () => {

  /**
   * TC-CAND-HOME-001
   * Verify that a candidate can open the Home page.
   */
  test('TC-CAND-HOME-001 - Candidate can open home page', async ({ page }) => {

    // Navigate to Home page
    await goToHome(page);

    // Verify onboarding description text appears
    await expect(
      page.getByText(/complete a few quick steps to start your job search/i)
    ).toBeVisible();
  });

  /**
   * TC-CAND-HOME-002
   * Verify that the onboarding step "Complete your profile" is visible.
   */
  test('TC-CAND-HOME-002 - Candidate can see onboarding step: Complete your profile', async ({ page }) => {

    // Open Home page
    await goToHome(page);

    // Verify profile onboarding step
    await expect(
      page.getByText(/complete your profile/i)
    ).toBeVisible();
  });

  /**
   * TC-CAND-HOME-003
   * Verify that the onboarding step "Upload your resume" is visible.
   */
  test('TC-CAND-HOME-003 - Candidate can see onboarding step: Upload your resume', async ({ page }) => {

    // Open Home page
    await goToHome(page);

    // Verify resume upload onboarding step
    await expect(
      page.getByText(/upload your resume/i)
    ).toBeVisible();
  });

  /**
   * TC-CAND-HOME-004
   * Verify that the onboarding step "Browse & apply to jobs" is visible.
   */
  test('TC-CAND-HOME-004 - Candidate can see onboarding step: Browse & apply to jobs', async ({ page }) => {

    // Open Home page
    await goToHome(page);

    // Verify job browsing onboarding step
    await expect(
      page.getByText(/browse & apply to jobs/i)
    ).toBeVisible();
  });

  /**
   * TC-CAND-HOME-005
   * Verify that the candidate can open the Profile page
   * from the onboarding section.
   */
  test('TC-CAND-HOME-005 - Candidate can open profile from home onboarding', async ({ page }) => {

    // Open Home page
    await goToHome(page);

    // Click the onboarding card for profile completion
    await page.getByRole('link', { name: /complete your profile/i }).click();

    // Verify navigation to profile page
    await expect(page).toHaveURL(/\/candidate\/profile/i);
  });

  /**
   * TC-CAND-HOME-006
   * Verify that the candidate can open the Jobs page
   * from the onboarding section.
   */
  test('TC-CAND-HOME-006 - Candidate can open jobs from home onboarding', async ({ page }) => {

    // Open Home page
    await goToHome(page);

    // Click onboarding link to browse jobs
    await page.getByRole('link', { name: /browse & apply to jobs/i }).click();

    // Verify navigation to jobs page
    await expect(page).toHaveURL(/\/candidate\/jobs/i);
  });

});

// test('TC-CAND-HOME-007 - Candidate can complete onboarding flow and enter dashboard', async ({ page }) => {
//   await loginAsCandidate(page);

//   // Step 1: Home onboarding
//   await page.getByRole('link', { name: /^Home$/i }).click();
//   await expect(page.getByText(/welcome to cataur/i)).toBeVisible();

//   // Step 2: open profile onboarding
//   await page.getByRole('link', { name: /complete your profile/i }).click();

//   // Step 3: Build your profile
//   await expect(page.getByText(/build your profile/i)).toBeVisible();
//   await expect(page.getByRole('button', { name: /upload resume/i })).toBeVisible();

//   const skipManual =
//     page.getByRole('button', { name: /skip and fill manually/i })
//       .or(page.getByRole('link', { name: /skip and fill manually/i }))
//       .or(page.getByText(/skip and fill manually/i).first());

//   await expect(skipManual).toBeVisible();
//   await skipManual.click();

//   // Step 4: Basic Information
//   await expect(
//     page.getByRole('heading', { name: /basic information/i })
//   ).toBeVisible({ timeout: 10000 });

//   await expect(
//     page.getByRole('button', { name: /continue to resume/i })
//   ).toBeVisible();

//   // Step 5: Continue to Resume
//   await page.getByRole('button', { name: /continue to resume/i }).click();

//   // Step 6: Upload Resume step
//   await expect(page.getByText(/upload resume/i)).toBeVisible();
//   await expect(page.getByText(/click to browse or drag and drop/i)).toBeVisible();

//   // Step 7: skip resume upload
//   await page.getByRole('button', { name: /skip this step/i }).click();

//   // Step 8: dashboard
//   await expect(page.getByText(/summary of your job search activity/i)).toBeVisible();
//   await expect(page.getByText(/recent applications/i)).toBeVisible();
//   await expect(page.getByText(/application pipeline/i)).toBeVisible();
// });