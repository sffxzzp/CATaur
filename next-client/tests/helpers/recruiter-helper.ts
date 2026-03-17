import { expect, type Page } from '@playwright/test';

/**
 * Open recruiter dashboard
 */
export async function openRecruiterDashboard(page: Page) {

  await page.goto('/recruiter');

  await expect(page).toHaveURL(/\/recruiter/i);

}

/**
 * Open recruiter job management
 */
export async function openRecruiterJobs(page: Page) {

  await page.goto('/recruiter/jobs');

  await expect(page).toHaveURL(/jobs/i);

}

/**
 * Open candidate management
 */
export async function openCandidateManagement(page: Page) {

  await page.goto('/recruiter/candidates');

  await expect(page).toHaveURL(/candidates/i);

}