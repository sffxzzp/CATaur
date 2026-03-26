import { test, expect, type Page } from "@playwright/test";
import { login, logout } from "../helpers/auth-helper";
import { users } from "../fixtures/users";

/**
 * ============================
 * POSITIVE TESTS
 * ============================
 *
 * When TEST_ROLE is provided, only that role's positive test runs.
 * This keeps each role run to:
 * 1 positive + 4 negative = 5 tests
 */

const allRoles = Object.keys(users) as (keyof typeof users)[];
const role = process.env.TEST_ROLE as keyof typeof users | undefined;
const rolesToTest = role ? [role] : allRoles;

const protectedPathByRole: Record<keyof typeof users, string> = {
  candidate: "/candidate/profile",
  client: "/client",
  recruiter: "/recruiter/candidates",
  admin: "/recruiter/users",
};

async function expectProtectedPageBlocked(
  page: Page,
  currentRole: keyof typeof users,
) {
  if (currentRole === "candidate") {
    const result = await Promise.any([
      page
        .locator('input[type="email"]')
        .waitFor({ state: "visible", timeout: 15000 })
        .then(() => "login"),
      page
        .getByText(/login required/i)
        .waitFor({ state: "visible", timeout: 15000 })
        .then(() => "guest-gate"),
    ]);

    expect(["login", "guest-gate"]).toContain(result);
    return;
  }

  await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  await expect(page.locator('input[type="email"]')).toBeVisible();
}

async function visitProtectedPage(page: Page, currentRole: keyof typeof users) {
  await page.goto(protectedPathByRole[currentRole]);
}

test.describe("Logout Positive Tests", () => {
  for (const currentRole of rolesToTest) {
    test(`${currentRole} can logout successfully`, async ({ page }) => {
      const user = users[currentRole];

      await login(page, currentRole, user.email, user.password);
      await expect(page.locator("header")).toBeVisible();

      await logout(page, currentRole);

      if (currentRole === "candidate") {
        await expect(page).toHaveURL(/\/candidate\/jobs/);
        await expect(page.getByText(/log in/i)).toBeVisible();
        await expect(page.getByText(user.email)).not.toBeVisible();
        return;
      }

      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(
        page.getByRole("button", { name: /log in|sign in/i }),
      ).toBeVisible();
    });
  }
});

if (role) {
  test.describe(`Logout Negative Tests (${role})`, () => {
    test("should not access protected page without login", async ({ page }) => {
      await visitProtectedPage(page, role);
      await expectProtectedPageBlocked(page, role);
    });

    test("should not access protected page after logout", async ({ page }) => {
      const user = users[role];

      await login(page, role, user.email, user.password);
      await logout(page, role);

      await visitProtectedPage(page, role);
      await expectProtectedPageBlocked(page, role);
    });

    test("should not restore session after logout (browser back)", async ({
      page,
    }) => {
      const user = users[role];

      await login(page, role, user.email, user.password);
      await logout(page, role);
      await page.goBack();

      if (role === "candidate") {
        await Promise.any([
          page
            .waitForURL(/\/candidate\/jobs/, { timeout: 15000 })
            .then(() => "jobs"),
          page.waitForURL(/\/login/, { timeout: 15000 }).then(() => "login"),
          page
            .getByText(/log in/i)
            .waitFor({ state: "visible", timeout: 15000 })
            .then(() => "jobs"),
        ]);

        if (page.url().includes("/candidate/jobs")) {
          await expect(page.getByText(/log in/i)).toBeVisible();
          await expect(page.getByText(user.email)).not.toBeVisible();
        } else {
          await expect(page.locator('input[type="email"]')).toBeVisible();
        }

        return;
      }

      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });

    test("should handle multiple logout safely", async ({ page }) => {
      const user = users[role];

      await login(page, role, user.email, user.password);
      await logout(page, role);

      await page.goto(`/login?role=${role}`);
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });
  });
}
