import { test, expect } from "@playwright/test";
import { register } from "../helpers/auth-helper";

/**
 * Register Test Suite (Candidate Only)
 *
 * Only candidate role supports self-registration.
 * Other roles (admin, client, recruiter) are created manually
 * and do not have a registration flow.
 */

test.describe("Register Tests (Candidate Only)", () => {
  test("candidate can register successfully", async ({ page }) => {
    // 🔹 Generate unique email (avoid duplicate)
    const email = `test_candidate_${Date.now()}@test.com`;
    const password = "Test123456!";

    /**
     * Step 1: Perform registration
     */
    await register(page, "candidate", email, password);

    /**
     * Step 2: Verify registration success
     * (UI-based validation)
     */

    // Option 1: redirected away from login
    await expect(page).not.toHaveURL(/login/);

    // Option 2: main layout appears
    await expect(page.locator("header")).toBeVisible();

    /**
     * Optional: success message (if your UI has one)
     */
    // await expect(page.getByText(/success|created/i)).toBeVisible();
  });
});
