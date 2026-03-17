import { expect, type Page } from '@playwright/test';

/**
 * Open client dashboard
 */
export async function openClientDashboard(page: Page) {

  await page.goto('/client');

  await expect(page).toHaveURL(/\/client/i);

}

/**
 * Open job posting page
 */
export async function openClientJobPosting(page: Page) {

  await page.goto('/client/jobs/new');

  await expect(page).toHaveURL(/jobs\/new/i);

}

/**
 * Open job management page
 */
export async function openClientJobManagement(page: Page) {

  await page.goto('/client/jobs');

  await expect(page).toHaveURL(/jobs/i);

}

/**
 * Open applications page
 */
export async function openClientApplications(page: Page) {

  await page.goto('/client/applications');

  await expect(page).toHaveURL(/applications/i);

}