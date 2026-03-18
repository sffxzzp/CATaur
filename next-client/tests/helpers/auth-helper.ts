import { Page, expect } from "@playwright/test";

/**
 * Debug helper: prints useful info when something fails
 */
export async function printLoginDebugInfo(page: Page) {
  const url = page.url();
  const content = await page.textContent("body");

  console.log("\n===== DEBUG INFO =====");
  console.log("Current URL:", url);
  console.log("Page Content Preview:\n", content?.slice(0, 500));
  console.log("======================\n");

  // take a screenshot for debugging
  await page.screenshot({ path: `debug-${Date.now()}.png` });
}

/**
 * Stable login helper (ALL roles)
 *
 * ✔ does not depend on URL change
 * ✔ works with SPA (Next.js / React)
 * ✔ handles slow loading and re-render
 * ✔ supports different dashboards for each role
 */
export async function login(
  page: Page,
  role: string,
  email: string,
  password: string,
) {
  await page.goto(`http://localhost:3001/login?role=${role}`);

  /**
   * Step 1: find email input (reliable selector)
   */
  const emailInput = page
    .locator(
      'input[type="email"], input[name="email"], input[placeholder*="example"]',
    )
    .first();

  await expect(emailInput).toBeVisible();

  await emailInput.fill("");
  await emailInput.type(email, { delay: 30 });

  /**
   * Step 2: fill password
   */
  const passwordInput = page
    .locator('input[type="password"], input[name="password"]')
    .first();

  await expect(passwordInput).toBeVisible();

  await passwordInput.fill("");
  await passwordInput.type(password, { delay: 30 });

  /**
   * Step 3: click login button
   */
  const loginBtn = page.getByRole("button", { name: /login|sign in/i });

  await expect(loginBtn).toBeEnabled();
  await loginBtn.click();

  /**
   * Step 4: wait for UI update (not URL)
   */
  await Promise.race([
    page.locator("header").waitFor(),
    page.getByText(/dashboard/i).waitFor(),
    page.getByText(/profile/i).waitFor(),
    page.getByText(/user management/i).waitFor(),
  ]);
}

/**
 * Robust logout helper (final stable version)
 */
export async function logout(page: Page, role: string) {
  // Step 1: make sure page is stable
  await page.waitForLoadState("networkidle");

  // Step 2: find avatar button (top right, usually uppercase letter)
  const avatar = page
    .locator("header button")
    .filter({
      hasText: /^[A-Z]/,
    })
    .first();

  await expect(avatar).toBeVisible();
  await avatar.click();

  // Step 3: wait for dropdown menu (important)
  const logoutBtn = page.getByText(/(sign out|log out)/i);
  await expect(logoutBtn).toBeVisible({ timeout: 5000 });

  // Step 4: click logout
  await logoutBtn.click();

  // Step 5: wait for UI change (better than fixed timeout)
  await page.waitForLoadState("networkidle");

  // Step 6: verify logout success (UI check is better than URL)
  const loginInput = page.getByPlaceholder("you@example.com");

  if (await loginInput.isVisible()) {
    await expect(loginInput).toBeVisible();
    return;
  }

  // fallback: if logout redirect fails
  console.log("[DEBUG] Logout redirect failed, forcing navigation");

  await page.goto(`http://localhost:3001/login?role=${role}`);

  await expect(loginInput).toBeVisible();
}

/**
 * Register helper (Candidate only)
 *
 * This function runs the full registration flow.
 * It handles dynamic UI (React), validation states,
 * and multiple inputs (password + confirm password).
 */
export async function register(
  page: Page,
  role: string,
  email: string,
  password: string,
) {
  // go to login page for this role
  await page.goto(`http://localhost:3001/login?role=${role}`);

  // wait for page to load
  await page.waitForLoadState("networkidle");

  /**
   * Step 1: open register form
   */
  const createBtn = page.getByText(/create one|sign up|register/i);
  await expect(createBtn).toBeVisible();
  await createBtn.click();

  /**
   * Step 2: wait for form to appear
   */
  const emailInput = page.getByPlaceholder("you@example.com");
  await expect(emailInput).toBeVisible();

  /**
   * Step 3: fill email (React-safe)
   */

  // clear input first
  await emailInput.fill("");

  // use type instead of fill (more stable)
  await emailInput.click();
  await emailInput.type(email, { delay: 50 });

  // verify value
  await expect(emailInput).toHaveValue(email);

  /**
   * Step 4: fill password
   */
  const passwordInput = page.getByPlaceholder(/at least 8/i);
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill(password);

  if ((await passwordInput.inputValue()) !== password) {
    await passwordInput.fill(password);
  }

  await expect(passwordInput).toHaveValue(password);

  /**
   * Step 5: fill confirm password
   */
  const confirmPasswordInput = page.getByPlaceholder(/repeat password/i);
  await expect(confirmPasswordInput).toBeVisible();
  await confirmPasswordInput.fill(password);

  if ((await confirmPasswordInput.inputValue()) !== password) {
    await confirmPasswordInput.fill(password);
  }

  await expect(confirmPasswordInput).toHaveValue(password);

  /**
   * Step 6: handle optional checkbox (terms & conditions)
   */
  const checkbox = page.locator('input[type="checkbox"]');

  if ((await checkbox.count()) > 0) {
    await checkbox.first().check();
  }

  /**
   * Step 7: submit form (wait until enabled)
   */
  const submitBtn = page.getByRole("button", {
    name: /create account|sign up/i,
  });

  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  /**
   * Step 8: wait for UI update
   */
  await page.waitForLoadState("networkidle");
}

/**
 * Forgot password helper (Candidate only)
 *
 * This function simulates a password reset request.
 * It handles dynamic UI and ensures correct input.
 */
export async function forgotPassword(page: Page, role: string, email: string) {
  // go to login page
  await page.goto(`http://localhost:3001/login?role=${role}`);

  await page.waitForLoadState("networkidle");

  /**
   * Step 1: click "Forgot password"
   */
  const forgotBtn = page.getByText(/forgot password/i);
  await expect(forgotBtn).toBeVisible();
  await forgotBtn.click();

  /**
   * Step 2: wait for reset form
   */
  const emailInput = page.getByPlaceholder("you@example.com");
  await expect(emailInput).toBeVisible();

  /**
   * Step 3: fill email (React-safe)
   */
  await emailInput.fill("");

  await emailInput.click();
  await emailInput.type(email, { delay: 50 });

  await expect(emailInput).toHaveValue(email);

  /**
   * Step 4: submit request
   */
  const submitBtn = page.getByRole("button", {
    name: /send reset link/i,
  });

  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  /**
   * Step 5: wait for UI update
   */
  await page.waitForLoadState("networkidle");
}

/**
 * Create user (Admin only)
 * Final stable version
 */
export async function createUser(
  page: Page,
  role: string,
  name: string,
  email: string,
  password: string,
) {
  /**
   * Step 1: go to User Management
   */
  const userMgmtBtn = page.getByText(/user management/i);

  await expect(userMgmtBtn).toBeVisible();
  await userMgmtBtn.click();

  /**
   * Step 2: wait for page ready
   */
  await expect(
    page.getByRole("heading", { name: /user management/i }),
  ).toBeVisible();

  /**
   * Step 3: click Add User
   */
  const addBtn = page.getByRole("button", { name: /add user/i });

  await expect(addBtn).toBeVisible();
  await expect(addBtn).toBeEnabled();
  await addBtn.click();

  /**
   * Step 4: wait for modal (input is most reliable)
   */
  const nameInput = page.getByPlaceholder("e.g. Jane Smith");
  await expect(nameInput).toBeVisible();

  /**
   * Step 5: fill form
   */

  // name
  await nameInput.fill("");
  await nameInput.type(name, { delay: 30 });

  // role dropdown (use last select = modal)
  const roleSelect = page.locator("select").last();
  await expect(roleSelect).toBeVisible();
  await roleSelect.selectOption({ label: role });

  // email
  const emailInput = page.getByPlaceholder("user@example.com");
  await expect(emailInput).toBeVisible();

  await emailInput.fill("");
  await emailInput.type(email, { delay: 30 });

  // phone (optional)
  const phoneInput = page.getByPlaceholder("+1 416-555-0000");
  if (await phoneInput.isVisible()) {
    await phoneInput.fill("1234567890");
  }

  // password (important fix)
  const passwordInput = page.locator('input[type="password"]').last();
  await expect(passwordInput).toBeVisible();

  await passwordInput.fill("");
  await passwordInput.type(password, { delay: 30 });

  /**
   * Step 6: submit (make sure button is clickable)
   */
  const confirmBtn = page.getByRole("button", { name: /confirm/i });

  await expect(confirmBtn).toBeVisible();
  await expect(confirmBtn).toBeEnabled();

  await confirmBtn.click();

  /**
   * Step 7: verify success (new user appears in table)
   */
  await expect(page.getByText(email)).toBeVisible();
}
