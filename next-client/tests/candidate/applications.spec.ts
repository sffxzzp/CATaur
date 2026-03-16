// Import Playwright testing tools
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
 * Helper function: Navigate to Applications page
 * Steps:
 * 1. Login as candidate
 * 2. Click "Applications" in navigation
 * 3. Verify Applications page is displayed
 */
async function goToApplications(page: Page) {

  // Login first
  await loginAsCandidate(page);

  // Click Applications link
  await page.getByRole('link', { name: /^Applications$/i }).click();

  // Verify page URL
  await expect(page).toHaveURL(/\/candidate\/applications/i);

  // Verify page heading
  await expect(
    page.getByRole('heading', { name: /^My Applications$/i })
  ).toBeVisible();
}

// Test suite for Candidate Applications feature
test.describe('Candidate - Applications', () => {

  /**
   * TC-CAND-APP-001
   * Verify that a candidate can open the Applications page.
   */
  test('TC-CAND-APP-001 - Candidate can open Applications page', async ({ page }) => {

    // Navigate to Applications page
    await goToApplications(page);

    // Verify page description text is visible
    await expect(
      page.getByText(/track the status of your submitted applications/i)
    ).toBeVisible();
  });

  /**
   * TC-CAND-APP-002
   * Verify that the candidate can view submitted job application cards.
   */
  test('TC-CAND-APP-002 - Candidate can view submitted application cards', async ({ page }) => {

    // Open Applications page
    await goToApplications(page);

    // Verify job title is visible
    await expect(page.getByText(/^Senior Backend Engineer$/i)).toBeVisible();

    // Verify company name is visible
    await expect(page.getByText(/^Neptune Pay$/i)).toBeVisible();

    // Verify job location is visible
    await expect(
      page.getByText(/^Toronto, ON, Canada$/i).first()
    ).toBeVisible();

    // Verify application status appears
    await expect(
      page.getByText(/application received|interview scheduled|offer received|position filled/i).first()
    ).toBeVisible();
  });

  /**
   * TC-CAND-APP-003
   * Verify that the candidate can open the related job page
   * from the Applications list.
   */
  test('TC-CAND-APP-003 - Candidate can open related job from Applications', async ({ page }) => {

    // Open Applications page
    await goToApplications(page);

    // Find and click "View Job"
    const viewJobLink = page.getByRole('link', { name: /view job/i }).first();
    await expect(viewJobLink).toBeVisible();
    await viewJobLink.click();

    // Verify navigation to job details page
    await expect(page).toHaveURL(/\/candidate\/jobs\/.+/i);
  });

  /**
   * TC-CAND-APP-004
   * Verify that the candidate can confirm an interview invitation.
   */
  test('TC-CAND-APP-004 - Candidate can confirm interview invitation', async ({ page }) => {

    // Open Applications page
    await goToApplications(page);

    // Click confirm interview button
    const confirmBtn = page.getByRole('button', { name: /confirm interview/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Verify confirmation message appears
    await expect(
      page.getByText(/interview confirmed/i)
    ).toBeVisible();

    // Verify confirmation state saved in localStorage
    const confirmed = await page.evaluate(() =>
      localStorage.getItem('interviewConfirmed_1')
    );

    // Expected result: confirmation flag = "1"
    expect(confirmed).toBe('1');
  });

});