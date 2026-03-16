import { test, expect, type Page, type Locator } from '@playwright/test';

function uniqueEmail(prefix = 'e2e.user') {
  return `${prefix}.${Date.now()}@example.com`;
}

/**
 * Log in as Recruiter/Admin
 * Currently recruiter and admin use the same account
 */
async function loginRecruiterAdmin(page: Page) {
  await page.goto('/login?role=recruiter');
  await page.locator('#email').fill('allan@cataur.com');
  await page.locator('#password').fill('123');
  await page.getByRole('button', { name: /^Sign in$/ }).click();

  // After login the page may go to /recruiter or /administer
  await expect(page).toHaveURL(/\/recruiter|\/administer/i);
}

/**
 * Open the User Management page
 */
async function openUserManagement(page: Page) {
  // Click the menu item on the left side
  await page.getByText(/user management/i).click();
  await expect(page.getByText(/user management/i)).toBeVisible({ timeout: 8000 });
}

/**
 * Open the Add User modal window
 * Return the modal container locator
 * We use the "Add User" title to find the modal
 */
async function openAddUserModal(page: Page): Promise<Locator> {
  // Click the Add User button
  await page.getByRole('button', { name: /^Add User$/i }).click();

  // Find the modal title
  const title = page.getByRole('heading', { name: /^Add User$/i });
  await expect(title).toBeVisible({ timeout: 8000 });

  // Go up in the DOM to find the modal container
  const modal = title.locator('xpath=ancestor::*[self::div or self::section][2]');
  await expect(modal).toBeVisible({ timeout: 8000 });

  // Make sure the modal contains input fields
  await expect(modal.locator('input').first()).toBeVisible({ timeout: 8000 });

  return modal;
}

/**
 * Fill the Add User form
 * Based on the placeholders in the UI:
 * - Account Name: "e.g. Jane Smith"
 * - Email: "user@example.com"
 * - Phone: "+1 416-555-0000"
 * - Password: password field
 * - Role: dropdown menu
 */
async function fillAddUserForm(modal: Locator, opts: {
  name: string;
  roleText: 'Recruiter' | 'Client';
  email: string;
  phone: string;
  password: string;
}) {
  // Fill Account Name
  await modal.locator('input[placeholder*="Jane"]').fill(opts.name);

  // Select Role (dropdown)
  const roleSelect = modal.locator('select').first();

  if (await roleSelect.count()) {
    // If it is a normal HTML select
    await roleSelect.selectOption({ label: opts.roleText });
  } else {
    // If it is a custom dropdown (Radix UI style)
    const roleTrigger =
      modal.getByRole('combobox').first()
        .or(modal.locator('button').filter({ hasText: /recruiter|client/i }).first())
        .or(modal.locator('button').filter({ hasText: /role/i }).first());

    await roleTrigger.click();

    // Options may appear outside the modal (portal)
    const page = modal.page();
    await page.getByText(new RegExp(`^${opts.roleText}$`, 'i')).click();
  }

  // Fill Email
  await modal.locator('input[placeholder*="user@"]').fill(opts.email);

  // Fill Phone
  await modal.locator('input[placeholder*="+1"]').fill(opts.phone);

  // Fill Password
  await modal.locator('input[type="password"]').fill(opts.password);

  // Status is Active by default, no need to change
}

/**
 * Click the Confirm button to create the user
 */
async function confirmAddUser(modal: Locator) {
  await modal.getByRole('button', { name: /confirm/i }).click();
}

test.describe('Admin - User Management (Add User)', () => {

  test('TC-UM-ADD-001 - Admin can add a Recruiter user', async ({ page }) => {
    const email = uniqueEmail('e2e.recruiter');
    const password = 'Password123!';

    await loginRecruiterAdmin(page);
    await openUserManagement(page);

    const modal = await openAddUserModal(page);

    await fillAddUserForm(modal, {
      name: 'E2E Recruiter',
      roleText: 'Recruiter',
      email,
      phone: '+1 403-555-0101',
      password,
    });

    await confirmAddUser(modal);

    // Verify the new email appears in the user list
    await expect(page.getByText(email)).toBeVisible({ timeout: 10000 });
  });

  test('TC-UM-ADD-002 - Admin can add a Client user', async ({ page }) => {
    const email = uniqueEmail('e2e.client');
    const password = 'Password123!';

    await loginRecruiterAdmin(page);
    await openUserManagement(page);

    const modal = await openAddUserModal(page);

    await fillAddUserForm(modal, {
      name: 'E2E Client',
      roleText: 'Client',
      email,
      phone: '+1 403-555-0202',
      password,
    });

    await confirmAddUser(modal);

    await expect(page.getByText(email)).toBeVisible({ timeout: 10000 });
  });

});