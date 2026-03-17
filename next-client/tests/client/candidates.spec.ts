import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth-helper";
/** * Test Suite: Client - Candidates * This suite verifies that the candidates page loads correctly * and shows the expected filters and table content. */ test.describe("Client - Candidates", () => {
  /** * TC001 * Verify that the Candidates page is accessible. */ test("TC001 - Client can open Candidates page", async ({
    page,
  }) => {
    await login(page, "client", "mike@outlook.com", "1234567890");
    await page.getByRole("link", { name: /Candidates/i }).click();
    await expect(page).toHaveURL(/candidates/i);
    await expect(page.getByText(/^Candidates$/i)).toBeVisible();
  });
  /** * TC002 * Verify that candidate status summary cards are visible. */ test("TC002 - Candidate summary cards are visible", async ({
    page,
  }) => {
    await login(page, "client", "mike@outlook.com", "1234567890");
    await page.getByRole("link", { name: /Candidates/i }).click();
    await expect(page.getByText(/^All$/i)).toBeVisible();
    await expect(page.getByText(/^New$/i)).toBeVisible();
    await expect(page.getByText(/^Interview$/i)).toBeVisible();
    await expect(page.getByText(/^Offer$/i)).toBeVisible();
    await expect(page.getByText(/^Closed$/i)).toBeVisible();
  });
  /** * TC003 * Verify that candidate table headers are visible. */ test("TC003 - Candidate table headers are visible", async ({
    page,
  }) => {
    await login(page, "client", "mike@outlook.com", "1234567890");
    await page.getByRole("link", { name: /Candidates/i }).click();
    await expect(page.getByText(/Candidate/i)).toBeVisible();
    await expect(page.getByText(/Applied For/i)).toBeVisible();
    await expect(page.getByText(/Status/i)).toBeVisible();
    await expect(page.getByText(/Applied/i)).toBeVisible();
    await expect(page.getByText(/Location/i)).toBeVisible();
  });
  /** * TC004 * Verify that the search box is visible on Candidates page. */ test("TC004 - Candidate search box is visible", async ({
    page,
  }) => {
    await login(page, "client", "mike@outlook.com", "1234567890");
    await page.getByRole("link", { name: /Candidates/i }).click();
    await expect(
      page.getByPlaceholder(/Search by name or job title/i),
    ).toBeVisible();
  });
});
