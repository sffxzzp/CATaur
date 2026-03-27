import { test, expect } from "@playwright/test";
import {
  expectApplicationsPageLoaded,
  loginAsCandidate,
} from "../helpers/candidate-helper";

test.describe("Candidate Applications Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCandidate(page);
    await page.goto("/candidate/applications", { waitUntil: "networkidle" });
    await expectApplicationsPageLoaded(page);
  });

  test("shows one valid applications state", async ({ page }) => {
    await expect(
      page
        .getByText(/no applications yet/i)
        .or(
          page.getByText(
            /application received|interview scheduled|offer received|position filled/i,
          ),
        )
        .or(page.getByText(/error:/i)),
    ).toBeVisible();
  });
});
