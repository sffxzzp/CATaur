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
 * Helper function: Navigate to Job Search page
 * Steps:
 * 1. Login as candidate
 * 2. Click "Job Search" in navigation
 * 3. Verify Job Search page is loaded
 */
async function goToJobs(page: Page) {

  // Login first
  await loginAsCandidate(page);

  // Open Job Search page
  await page.getByRole('link', { name: /^Job Search$/i }).click();

  // Verify correct URL
  await expect(page).toHaveURL(/\/candidate\/jobs/i);

  // Verify page heading
  await expect(
    page.getByRole('heading', { name: /^Job Search$/i })
  ).toBeVisible();
}

// Test suite for Candidate Job Search feature
test.describe('Candidate - Job Search', () => {

  /**
   * TC-CAND-JOB-001
   * Verify that candidate can view job listings.
   */
  test('TC-CAND-JOB-001 - Candidate can view job listings', async ({ page }) => {

    // Navigate to Job Search page
    await goToJobs(page);

    // Verify job search description text
    await expect(
      page.getByText(/browse open positions and apply directly/i)
    ).toBeVisible();

    // Verify pagination information (example: "1 of 12 positions")
    await expect(
      page.getByText(/\d+\s+of\s+\d+\s+positions/i)
    ).toBeVisible();

    // Verify at least one job listing appears
    await expect(
      page.getByText(/senior backend engineer|frontend engineer|devops/i).first()
    ).toBeVisible();
  });

  /**
   * TC-CAND-JOB-002
   * Verify that candidate can open job details page.
   */
  test('TC-CAND-JOB-002 - Candidate can open job details', async ({ page }) => {

    // Open Job Search page
    await goToJobs(page);

    // Click "View Details" on a job card
    const viewDetailsLink = page.getByRole('link', { name: /view details/i }).first();
    await expect(viewDetailsLink).toBeVisible();
    await viewDetailsLink.click();

    // Verify navigation to job details page
    await expect(page).toHaveURL(/\/candidate\/jobs\/.+/i);

    // Verify job information appears on the details page
    await expect(
      page.getByText(/senior backend engineer|frontend engineer|devops|neptune pay|aurora cloud|atlas robotics/i).first()
    ).toBeVisible();
  });

  /**
   * TC-CAND-JOB-003
   * Verify that candidate can click "Apply Now" from job list.
   */
  test('TC-CAND-JOB-003 - Candidate can click Apply Now', async ({ page }) => {

    // Open Job Search page
    await goToJobs(page);

    // Click "Apply Now" link on a job card
    const applyLink = page.getByRole('link', { name: /apply now/i }).first();
    await expect(applyLink).toBeVisible();
    await applyLink.click();

    // Apply Now redirects to job details page
    await expect(page).toHaveURL(/\/candidate\/jobs\/.+/i);

    // Verify job information is visible
    await expect(
      page.getByText(/senior backend engineer|frontend engineer|devops|neptune pay|aurora cloud|atlas robotics/i).first()
    ).toBeVisible();
  });

});