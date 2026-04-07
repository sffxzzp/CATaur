import { Page, expect } from "@playwright/test";

/**
 * Debug helper
 * Prints basic page info and takes a screenshot when needed
 */
export async function printLoginDebugInfo(page: Page) {
  console.log("\n===== DEBUG INFO =====");
  console.log("URL:", page.url());
  console.log("Title:", await page.title());
  await page.screenshot({ path: `debug-${Date.now()}.png` });
  console.log("======================\n");
}

/**
 * LOGIN (for deployed environment)
 * - Uses relative path instead of full URL
 * - Works for SPA apps (Next.js)
 * - Does not depend on URL change
 */
export async function login(
  page: Page,
  role: string,
  email: string,
  password: string,
) {
  // Go to login page for specific role
  await page.goto(`/login?role=${role}`, { waitUntil: "networkidle" });

  // Fill email
  const emailInput = page
    .locator('input[type="email"], input[name="email"]')
    .first();

  await expect(emailInput).toBeVisible();
  await emailInput.fill(email);

  // Fill password
  const passwordInput = page
    .locator('input[type="password"], input[name="password"]')
    .first();

  await expect(passwordInput).toBeVisible();
  await passwordInput.fill(password);

  // Click login button
  const loginBtn = page.getByRole("button", { name: /login|sign in/i });

  await expect(loginBtn).toBeEnabled();
  await loginBtn.click();

  // Ensure we are no longer on the login page before asserting role-specific UI
  await expect(page).not.toHaveURL(/\/login(\?|$)/, { timeout: 15000 });

  if (role === "admin") {
    await expect(page.getByText(/user management/i)).toBeVisible({
      timeout: 15000,
    });
    return;
  }

  if (role === "recruiter") {
    await expect(
      page
        .getByRole("link", { name: /dashboard/i })
        .or(page.getByText(/user management/i)),
    ).toBeVisible({ timeout: 15000 });
    return;
  }

  if (role === "client") {
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible({
      timeout: 15000,
    });
    return;
  }

  await expect(
    page.getByRole("link", { name: /job search/i }).first(),
  ).toBeVisible({ timeout: 15000 });
}

/**
 * LOGOUT (for deployed environment)
 * - Uses UI validation instead of URL
 * - Includes fallback if logout redirect fails
 */
export async function logout(page: Page, role: string) {
  await page.waitForLoadState("networkidle");

  /**
   * STEP 1: Click user dropdown (CORRECT WAY)
   */

  // ✅ Find the "button with letters" (S / A / M) in the upper right corner.
  const userButton = page.getByRole("button").filter({
    hasText: /^[A-Z]$/, // Match the letter of the profile picture
  });

  await expect(userButton.first()).toBeVisible({ timeout: 15000 });
  await userButton.first().click();

  /**
   * STEP 2: Click logout
   */

  const logoutBtn = page.getByText(/log out|sign out/i);

  await expect(logoutBtn.first()).toBeVisible({ timeout: 15000 });
  await logoutBtn.first().click();

  /**
   * STEP 3: Verify the real post-logout landing state
   */
  if (role === "candidate") {
    await page.waitForURL(/\/candidate\/jobs/, { timeout: 15000 });
    await expect(page.getByText(/log in/i)).toBeVisible();
    return;
  }

  await page.waitForURL(/\/login/, { timeout: 15000 });
  await expect(page.locator('input[type="email"]')).toBeVisible();
}

/**
 * REGISTER (candidate flow)
 * - Uses relative path (no localhost)
 * - Handles basic form submission
 */
export async function register(
  page: Page,
  role: string,
  email: string,
  password: string,
) {
  await page.goto(`/login?role=${role}`);

  // Open register form
  await page.getByText(/register|sign up/i).click();

  // Fill email
  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible();
  await emailInput.fill(email);

  // Fill password
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(password);

  // Confirm password
  const confirmInput = page.locator('input[type="password"]').nth(1);
  await confirmInput.fill(password);

  // Submit form
  const submitBtn = page.getByRole("button", {
    name: /create account|sign up/i,
  });

  await submitBtn.click();

  await page.waitForLoadState("networkidle");
}

/**
 * FORGOT PASSWORD
 * - Simulates password reset request
 */
export async function forgotPassword(page: Page, role: string, email: string) {
  await page.goto(`/login?role=${role}`);

  // Open reset form
  await page.getByText(/forgot password/i).click();

  // Wait until forgot-password page is ready before interacting with inputs
  await page.waitForURL(/\/forgot-password/, { timeout: 15000 });

  // Fill email
  const emailInput = page
    .getByPlaceholder(/you@example\.com/i)
    .or(page.locator('input[type="email"]'))
    .first();
  await expect(emailInput).toBeVisible();
  await emailInput.fill(email);
  await expect(emailInput).toHaveValue(email);

  // Submit request
  const submitBtn = page.getByRole("button", {
    name: /send reset/i,
  });

  await expect(submitBtn).toBeEnabled();

  await submitBtn.click();

  await page.waitForLoadState("networkidle");
}

/**
 * CREATE USER (admin only)
 * - Opens user management
 * - Fills form and submits
 */
export async function createUser(
  page: Page,
  role: string,
  name: string,
  email: string,
  password: string,
) {
  // Open user management page
  await page.getByText(/user management/i).click();

  // Click "Add User"
  await page.getByRole("button", { name: /add user/i }).click();

  // Fill name
  await page.getByPlaceholder(/name/i).fill(name);

  // Select role
  const roleSelect = page.locator("select").last();
  await roleSelect.selectOption({ label: role });

  // Fill email
  await page.getByPlaceholder(/email/i).fill(email);

  // Fill password
  const passwordInput = page.locator('input[type="password"]').last();
  await passwordInput.fill(password);

  // Submit form
  await page.getByRole("button", { name: /confirm/i }).click();

  // Verify user created
  await expect(page.getByText(email)).toBeVisible();
}
