import { expect, Locator, Page } from "@playwright/test";

export type AdminRole = "Recruiter" | "Client" | "Admin";

export type AdminUserInput = {
  accountName: string;
  email: string;
  password: string;
  role: AdminRole;
  phone?: string;
  status?: "active" | "disabled";
};

type UserRecord = {
  id: string;
  email: string;
};

type ApiResult = {
  status: number;
  data: any;
};

async function authedRequest(
  page: Page,
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  body?: Record<string, unknown>,
): Promise<ApiResult> {
  return page.evaluate(
    async ({ method, url, body }) => {
      const token = window.localStorage.getItem("authToken");
      if (!token) {
        return { status: 0, data: { message: "NO_AUTH_TOKEN" } };
      }

      const apiUrl = url.startsWith("/api/") ? url : `/api${url}`;

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };

      if (body) {
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(apiUrl, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      return { status: res.status, data };
    },
    { method, url, body },
  );
}

export async function openUserManagement(page: Page) {
  await page.goto("/recruiter/users", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", { name: /user management/i }),
  ).toBeVisible();
}

export async function addUserViaUI(page: Page, input: AdminUserInput) {
  await page.getByRole("button", { name: /add user/i }).click();
  await expect(page.getByRole("heading", { name: /add user/i })).toBeVisible();

  await page.getByPlaceholder(/jane smith/i).fill(input.accountName);
  await page.locator("select").first().selectOption({ label: input.role });
  await page.getByPlaceholder(/user@example\.com/i).fill(input.email);

  if (input.phone) {
    await page.getByPlaceholder(/\+1 416-555-0000/i).fill(input.phone);
  }

  await page.locator('input[type="password"]').last().fill(input.password);

  if (input.status === "disabled") {
    const statusLabel = page.getByText(/^Active$|^Disabled$/i).first();
    if ((await statusLabel.textContent())?.toLowerCase().includes("active")) {
      await statusLabel.click();
    }
  }

  await page.getByRole("button", { name: /confirm/i }).click();
}

function rowByEmail(page: Page, email: string): Locator {
  return page.locator("tr").filter({ hasText: email }).first();
}

export async function expectUserVisible(page: Page, email: string) {
  await expect(rowByEmail(page, email)).toBeVisible();
}

export async function searchByEmail(page: Page, email: string) {
  const searchInput = page.getByPlaceholder(/search name, email/i);
  await searchInput.fill(email);
  await page.waitForLoadState("networkidle");
}

export async function editUserPasswordViaUI(
  page: Page,
  email: string,
  newPassword: string,
) {
  const row = rowByEmail(page, email);
  await expect(row).toBeVisible();

  await row.locator('button[title="Edit"]').click();
  await expect(page.getByRole("heading", { name: /edit user/i })).toBeVisible();

  await page.locator('input[type="password"]').last().fill(newPassword);
  await page.getByRole("button", { name: /confirm/i }).click();
}

export async function deleteUserViaUI(page: Page, email: string) {
  const row = rowByEmail(page, email);
  await expect(row).toBeVisible();

  await row.locator('button[title="Delete"]').click();
  await expect(
    page.getByRole("heading", { name: /delete user/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^delete$/i }).click();
}

export async function listUsersByEmail(page: Page, email: string) {
  const result = await authedRequest(
    page,
    "GET",
    `/admin/users?page=1&limit=100&search=${encodeURIComponent(email)}`,
  );

  const list = Array.isArray(result.data?.data) ? result.data.data : [];
  return list.filter(
    (u: any) => String(u.email).toLowerCase() === email.toLowerCase(),
  );
}

export async function createUserViaApi(page: Page, input: AdminUserInput) {
  const result = await authedRequest(page, "POST", "/admin/users", {
    accountName: input.accountName,
    role: input.role,
    email: input.email,
    phone: input.phone ?? null,
    password: input.password,
    isActive: input.status !== "disabled",
  });

  if (result.status >= 400) {
    throw new Error(
      result.data?.message ?? `Create user failed: ${result.status}`,
    );
  }

  const users = await listUsersByEmail(page, input.email);
  const user = users[0] as UserRecord | undefined;
  if (!user?.id) {
    throw new Error("User created but could not be found by email");
  }

  return user.id;
}

export async function ensureUserDeletedByEmail(page: Page, email: string) {
  const users = await listUsersByEmail(page, email);

  for (const u of users) {
    await authedRequest(page, "DELETE", `/admin/users/${u.id}`);
  }
}

export async function getAdminUsersApiStatus(page: Page) {
  const result = await authedRequest(
    page,
    "GET",
    "/admin/users?page=1&limit=1",
  );
  return result.status;
}
