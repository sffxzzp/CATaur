import { test, expect } from "@playwright/test";
import {
  expectJobsPageLoaded,
  loginAsCandidate,
} from "../helpers/candidate-helper";

test.describe("Candidate Job Search Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCandidate(page);
    await page.goto("/candidate/jobs", { waitUntil: "networkidle" });
    await expectJobsPageLoaded(page);
  });

  test("supports keyword filter and clear filters", async ({ page }) => {
    const keywordInput = page.getByPlaceholder(/job title or company/i);
    const noMatchKeyword = `nohit-${Date.now()}`;

    await keywordInput.fill(noMatchKeyword);
    await expect(page.getByText(/no jobs match your filters/i)).toBeVisible();

    await page
      .getByRole("button", { name: /clear filters|clear all filters/i })
      .first()
      .click();
    await expect(keywordInput).toHaveValue("");
    await expect(page.getByText(/positions/i).first()).toBeVisible();
  });

  test("supports sort option changes", async ({ page }) => {
    const sortSelect = page.locator("select").last();

    await sortSelect.selectOption("Most Openings");
    await expect(sortSelect).toHaveValue("Most Openings");

    await sortSelect.selectOption("Most Recent");
    await expect(sortSelect).toHaveValue("Most Recent");
  });
});
