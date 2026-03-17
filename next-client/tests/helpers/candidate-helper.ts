import { expect, type Page } from '@playwright/test';

/**
 * Open candidate dashboard
 */
export async function openCandidateDashboard(page: Page) {

  await page.goto('/candidate');

  await expect(page).toHaveURL(/\/candidate/i);

}

/**
 * Open job search page
 */
export async function openJobSearch(page: Page) {

  await page.goto('/candidate/jobs');

  await expect(page).toHaveURL(/jobs/i);

}

/**
 * Open applications page
 */
export async function openCandidateApplications(page: Page) {

  await page.goto('/candidate/applications');

  await expect(page).toHaveURL(/applications/i);

}