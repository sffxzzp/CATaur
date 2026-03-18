import { test } from "@playwright/test";
import { login } from "../helpers/auth-helper";
import { createUser } from "../helpers/auth-helper";

test.describe("Admin - User Management", () => {
  test("admin can create recruiter", async ({ page }) => {
    await login(page, "admin", "admin@test.com", "1234567890");

    const email = `recruiter_${Date.now()}@test.com`;

    await createUser(page, "Recruiter", "Test Recruiter", email, "1234567890");
  });
});
