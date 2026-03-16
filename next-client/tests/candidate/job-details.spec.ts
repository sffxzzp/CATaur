// Import Playwright testing functions
import { test, expect, type Page } from '@playwright/test';

/**
 * Helper function: Login as a candidate user
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

  // Verify successful login by checking candidate dashboard URL
  await expect(page).toHaveURL(/\/candidate/i);
}

/**
 * Helper function: Navigate to the first job details page
 * Steps:
 * 1. Login as candidate
 * 2. Open Job Search page
 * 3. Click "View Details" on the first job
 * 4. Verify navigation to job details page
 */
async function goToFirstJobDetails(page: Page) {

  // Login first
  await loginAsCandidate(page);

  // Open Job Search page
  await page.getByRole('link', { name: /^Job Search$/i }).click();

  // Verify Job Search page is loaded
  await expect(page).toHaveURL(/\/candidate\/jobs/i);
  await expect(
    page.getByRole('heading', { name: /^Job Search$/i })
  ).toBeVisible();

  // Click "View Details" on the first job card
  const firstViewDetails = page.getByRole('link', { name: /view details/i }).first();
  await expect(firstViewDetails).toBeVisible();
  await firstViewDetails.click();

  // Verify navigation to job details page
  await expect(page).toHaveURL(/\/candidate\/jobs\/.+/i);
}

// Test suite for Candidate Job Details page
test.describe('Candidate - Job Details', () => {

  /**
   * TC-CAND-DETAIL-001
   * Verify that a candidate can open a job details page.
   */
  test('TC-CAND-DETAIL-001 - Candidate can open job details page', async ({ page }) => {

    // Navigate to first job details
    await goToFirstJobDetails(page);

    // Verify job title (usually shown as main heading)
    await expect(
      page.locator('h1').first()
    ).toBeVisible();
  });

  /**
   * TC-CAND-DETAIL-002
   * Verify that job details information is visible.
   */
  test('TC-CAND-DETAIL-002 - Candidate can see job detail content', async ({ page }) => {

    // Open job details page
    await goToFirstJobDetails(page);

    // Verify job type or work mode information
    await expect(
      page.getByText(/remote|hybrid|onsite|full-time|part-time|contract|internship|permanent/i).first()
    ).toBeVisible();

    // Verify other job information such as salary, company, or location
    await expect(
      page.getByText(/opening|openings|posted|salary|\$|location|company/i).first()
    ).toBeVisible();
  });

  /**
   * TC-CAND-DETAIL-003
   * Verify that the Apply action is available on the job details page.
   */
  test('TC-CAND-DETAIL-003 - Candidate can see apply action on detail page', async ({ page }) => {

    // Open job details page
    await goToFirstJobDetails(page);

    // Locate Apply button or link
    const applyAction =
      page.getByRole('button', { name: /apply|apply now|submit application/i }).first()
        .or(page.getByRole('link', { name: /apply|apply now|submit application/i }).first());

    // Verify apply action is visible
    await expect(applyAction).toBeVisible();
  });

  /**
   * TC-CAND-DETAIL-004
   * Verify that a candidate can click the Apply action from job details.
   */
  test('TC-CAND-DETAIL-004 - Candidate can click apply action from detail page', async ({ page }) => {

    // Open job details page
    await goToFirstJobDetails(page);

    // Locate Apply button or link
    const applyAction =
      page.getByRole('button', { name: /apply|apply now|submit application/i }).first()
        .or(page.getByRole('link', { name: /apply|apply now|submit application/i }).first());

    // Click apply action
    await expect(applyAction).toBeVisible();
    await applyAction.click();

    // Verify result after applying (success message or confirmation)
    await expect(
      page.getByText(/apply|application|submitted|success|confirm|already applied/i).first()
    ).toBeVisible();
  });

});