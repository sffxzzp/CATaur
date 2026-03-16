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

// Test suite for candidate navigation
test.describe('Candidate - Navigation', () => {

  /**
   * Before each test:
   * Login as candidate so the navigation menu is available.
   */
  test.beforeEach(async ({ page }) => {
    await loginAsCandidate(page);
  });

  /**
   * TC-CAND-NAV-001
   * Verify candidate can navigate to the Home page.
   */
  test('TC-CAND-NAV-001 - Candidate can navigate to Home', async ({ page }) => {

    // Click Home in navigation menu
    await page.getByRole('link', { name: /^Home$/i }).click();

    // Verify Home page content
    await expect(page.getByText(/welcome to cataur/i)).toBeVisible();
    await expect(
      page.getByText(/complete a few quick steps to start your job search/i)
    ).toBeVisible();

    // Verify onboarding steps are visible
    await expect(page.getByText(/complete your profile/i)).toBeVisible();
    await expect(page.getByText(/upload your resume/i)).toBeVisible();
    await expect(page.getByText(/browse & apply to jobs/i)).toBeVisible();
  });

  /**
   * TC-CAND-NAV-002
   * Verify candidate can navigate to the Profile page.
   */
  test('TC-CAND-NAV-002 - Candidate can navigate to Profile', async ({ page }) => {

    // Click Profile link
    await page.getByRole('link', { name: /^Profile$/i }).click();

    // Verify URL changed to profile page
    await expect(page).toHaveURL(/\/candidate\/profile/i);

    // Verify profile page elements
    await expect(page.getByText(/build your profile/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /upload resume/i })
    ).toBeVisible();
    await expect(page.getByText(/skip and fill manually/i)).toBeVisible();
  });

  /**
   * TC-CAND-NAV-003
   * Verify candidate can navigate to Job Search page.
   */
  test('TC-CAND-NAV-003 - Candidate can navigate to Job Search', async ({ page }) => {

    // Click Job Search link
    await page.getByRole('link', { name: /^Job Search$/i }).click();

    // Verify Job Search page loaded
    await expect(page).toHaveURL(/\/candidate\/jobs/i);
    await expect(
      page.getByRole('heading', { name: /^Job Search$/i })
    ).toBeVisible();

    // Verify job search information
    await expect(
      page.getByText(/browse open positions and apply directly/i)
    ).toBeVisible();

    // Verify pagination info exists
    await expect(
      page.getByText(/\d+\s+of\s+\d+\s+positions/i)
    ).toBeVisible();
  });

  /**
   * TC-CAND-NAV-004
   * Verify candidate can navigate to Applications page.
   */
  test('TC-CAND-NAV-004 - Candidate can navigate to Applications', async ({ page }) => {

    // Click Applications link
    await page.getByRole('link', { name: /^Applications$/i }).click();

    // Verify Applications page
    await expect(page).toHaveURL(/\/candidate\/applications/i);
    await expect(page.getByText(/my applications/i)).toBeVisible();

    // Verify page description
    await expect(
      page.getByText(/track the status of your submitted applications/i)
    ).toBeVisible();

    // Verify at least one application appears
    await expect(
      page.getByText(/senior backend engineer|frontend engineer|devops/i).first()
    ).toBeVisible();
  });

  /**
   * TC-CAND-NAV-005
   * Verify candidate can navigate to AI Assistant page.
   */
  test('TC-CAND-NAV-005 - Candidate can navigate to AI Assistant', async ({ page }) => {

    // Click AI Assistant link
    await page.getByRole('link', { name: /^AI Assistant$/i }).click();

    // Verify assistant page loaded
    await expect(page).toHaveURL(/\/candidate\/assistant/i);

    // Verify assistant interface elements
    await expect(
      page.getByRole('heading', { name: /^AI Assistant$/i })
    ).toBeVisible();

    await expect(
      page.getByPlaceholder(/ask me anything about your career/i)
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: /send/i })
    ).toBeVisible();
  });

});