import { test, expect } from "@playwright/test";
import {
  expectProfilePageLoaded,
  loginAsCandidate,
} from "../helpers/candidate-helper";

test.describe("Candidate Profile Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCandidate(page);
    await page.goto("/candidate/profile", { waitUntil: "networkidle" });
    await expectProfilePageLoaded(page);
  });

  test("renders a valid profile workflow state", async ({ page }) => {
    const onboardingHeading = page.getByRole("heading", {
      name: /basic information/i,
    });

    if ((await onboardingHeading.count()) > 0) {
      await expect(onboardingHeading.first()).toBeVisible();
      await expect(page.getByPlaceholder("John")).toBeVisible();
      await expect(page.getByPlaceholder("Doe")).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.getByPlaceholder(/linkedin\.com\/in/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /continue to resume/i }),
      ).toBeVisible();
      return;
    }

    await expect(page.getByText(/work experience/i).first()).toBeVisible();
    await expect(page.getByText(/education/i).first()).toBeVisible();
    await expect(page.getByText(/skills & expertise/i).first()).toBeVisible();
  });
});
