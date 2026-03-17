import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth-helper";
/** * Test Suite: Client - Decisions * This suite verifies that the decisions page loads correctly * and displays the expected actions. */ test.describe("Client - Decisions", () => {
  /** * TC001 * Verify that the Decisions page is accessible. */ test("TC001 - Client can open Decisions page", async ({
    page,
  }) => {
    await login(page, "client", "mike@outlook.com", "1234567890");
    await page.getByRole("link", { name: /Decisions/i }).click();
    await expect(page).toHaveURL(/decisions/i);
    await expect(page.getByText(/^Decisions$/i)).toBeVisible();
  });
  /** * TC002 * Verify that the decision summary cards are visible. */ test("TC002 - Decision summary cards are visible", async ({
    page,
  }) => {
    await login(page, "client", "mike@outlook.com", "1234567890");
    await page.getByRole("link", { name: /Decisions/i }).click();
    await expect(page.getByText(/^Pending$/i)).toBeVisible();
    await expect(page.getByText(/Offer Requested/i)).toBeVisible();
    await expect(page.getByText(/^Passed$/i)).toBeVisible();
    await expect(page.getByText(/On Hold/i)).toBeVisible();
  });
  /** * TC003 * Verify that decision action buttons are visible. */ test("TC003 - Decision action buttons are visible", async ({
    page,
  }) => {
    await login(page, "client", "mike@outlook.com", "1234567890");
    await page.getByRole("link", { name: /Decisions/i }).click();
    await expect(
      page.getByRole("button", { name: /Request Offer/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Pass$/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Hold/i }).first(),
    ).toBeVisible();
  });
  /** * TC004 * Verify that the guide section is visible. */ test("TC004 - Decision guide section is visible", async ({
    page,
  }) => {
    await login(page, "client", "mike@outlook.com", "1234567890");
    await page.getByRole("link", { name: /Decisions/i }).click();
    await expect(page.getByText(/How this works/i)).toBeVisible();
    await expect(page.getByText(/View all candidates/i)).toBeVisible();
  });
});
