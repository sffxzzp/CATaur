import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth-helper";
import { users } from "../fixtures/users";
import {
  addUserViaUI,
  createUserViaApi,
  deleteUserViaUI,
  editUserPasswordViaUI,
  ensureUserDeletedByEmail,
  expectUserVisible,
  listUsersByEmail,
  openUserManagement,
  searchByEmail,
} from "../helpers/admin-helper";

test.describe.configure({ mode: "serial" });

test.describe("Admin - User Management", () => {
  test("@positive admin can create recruiter and cleanup", async ({ page }) => {
    const email = `ui_create_${Date.now()}@test.com`;

    await login(page, "admin", users.admin.email, users.admin.password);
    await openUserManagement(page);
    await ensureUserDeletedByEmail(page, email);

    try {
      await addUserViaUI(page, {
        accountName: "UI Create Recruiter",
        email,
        password: "Test123456789!",
        role: "Recruiter",
      });

      await expect(page.getByText(/user created successfully/i)).toBeVisible();
      await expectUserVisible(page, email);
    } finally {
      await ensureUserDeletedByEmail(page, email);
    }
  });

  test("@positive admin can reset user password and cleanup", async ({
    page,
  }) => {
    const email = `ui_reset_${Date.now()}@test.com`;

    await login(page, "admin", users.admin.email, users.admin.password);
    await openUserManagement(page);
    await ensureUserDeletedByEmail(page, email);
    await createUserViaApi(page, {
      accountName: "Reset Target",
      email,
      password: "OldPass123456!",
      role: "Recruiter",
    });

    try {
      await searchByEmail(page, email);
      await editUserPasswordViaUI(page, email, "NewPass123456!");
      await expect(page.getByText(/user updated successfully/i)).toBeVisible();
    } finally {
      await ensureUserDeletedByEmail(page, email);
    }
  });

  test("@negative add user validates required fields", async ({ page }) => {
    await login(page, "admin", users.admin.email, users.admin.password);
    await openUserManagement(page);

    await page.getByRole("button", { name: /add user/i }).click();
    await page.getByRole("button", { name: /confirm/i }).click();

    await expect(page.getByText(/account name is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test("@negative duplicate email is rejected and data restored", async ({
    page,
  }) => {
    const email = `dup_${Date.now()}@test.com`;

    await login(page, "admin", users.admin.email, users.admin.password);
    await openUserManagement(page);
    await ensureUserDeletedByEmail(page, email);
    await createUserViaApi(page, {
      accountName: "Duplicate Seed",
      email,
      password: "SeedPass123456!",
      role: "Recruiter",
    });

    try {
      await addUserViaUI(page, {
        accountName: "Duplicate Attempt",
        email,
        password: "Test123456789!",
        role: "Recruiter",
      });

      await expect(page.getByText(/already exists|duplicate/i)).toBeVisible();

      const exact = await listUsersByEmail(page, email);
      expect(exact.length).toBe(1);
    } finally {
      await ensureUserDeletedByEmail(page, email);
    }
  });

  test("@permission recruiter cannot access user-management capability", async ({
    page,
  }) => {
    await login(
      page,
      "recruiter",
      users.recruiter.email,
      users.recruiter.password,
    );

    await expect(page.getByText(/^recruiter$/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /ai provider config/i }),
    ).toHaveCount(0);
    await expect(page.getByRole("link", { name: /email server/i })).toHaveCount(
      0,
    );
    await expect(page.getByRole("link", { name: /audit logs/i })).toHaveCount(
      0,
    );
  });
});
