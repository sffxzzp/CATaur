import { test, expect } from "@playwright/test";
import { login, printLoginDebugInfo } from "../helpers/auth-helper";

test.describe("Client - Dashboard", () => {
  test("TC001 - Client can access dashboard", async ({ page }) => {
    await login(page, "client", "mike@outlook.com", "1234567890");

    if (/\/login\?role=client/i.test(page.url())) {
      await printLoginDebugInfo(page, "Client login failed");
    }

    await expect(page).not.toHaveURL(/\/login\?role=client/i);
    await expect(page).toHaveURL(/\/client/i);

    await expect(page.getByText(/^Dashboard$/i).first()).toBeVisible();
  });

  test("TC002 - Summary cards are visible", async ({ page }) => {
    await login(page, "client", "mike@outlook.com", "1234567890");

    await expect(page.getByText(/Active Job Orders/i).first()).toBeVisible();
    await expect(page.getByText(/Total Candidates/i).first()).toBeVisible();
    await expect(
      page.getByText(/Awaiting Your Decision/i).first(),
    ).toBeVisible();
    await expect(page.getByText(/Offers in Progress/i).first()).toBeVisible();
  });

  test("TC003 - Recent Candidates section is visible", async ({ page }) => {
    await login(page, "client", "mike@outlook.com", "1234567890");

    await expect(page.getByText(/Recent Candidates/i).first()).toBeVisible();
  });

  test("TC004 - Right side dashboard panels are visible", async ({ page }) => {
    await login(page, "client", "mike@outlook.com", "1234567890");

    await expect(page.getByText(/My Decisions/i).first()).toBeVisible();
    await expect(page.getByText(/My Job Orders/i).first()).toBeVisible();
  });
});
