import { test, expect } from "@playwright/test";
import {
  expectCandidateDashboardLoaded,
  loginAsCandidate,
} from "../helpers/candidate-helper";

test.describe("Candidate Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCandidate(page);
  });

  test("shows dashboard and primary navigation", async ({ page }) => {
    await page.goto("/candidate", { waitUntil: "networkidle" });

    await expectCandidateDashboardLoaded(page);
    await expect(page.getByRole("link", { name: /^home$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^profile$/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /^job search$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /^applications$/i }),
    ).toBeVisible();
  });
});
