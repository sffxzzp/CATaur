import { test, expect, type Page } from "@playwright/test";
import { login } from "../helpers/auth-helper";
import { users } from "../fixtures/users";

const CANDIDATE_BASE = "http://candidate.kawaiimonkey.top";

type ApiResult = {
  status: number;
  data: any;
};

async function authedRequest(
  page: Page,
  method: "GET" | "POST" | "DELETE",
  url: string,
  body?: Record<string, unknown>,
): Promise<ApiResult> {
  return page.evaluate(
    async ({ method, url, body }) => {
      const token = window.localStorage.getItem("authToken");
      if (!token) return { status: 0, data: { message: "NO_AUTH_TOKEN" } };

      const res = await fetch(`/api${url}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
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

test.describe("Candidate Apply Negative Cases", () => {
  test("@negative guest clicking apply should be asked to sign in", async ({
    page,
  }) => {
    await page.goto(`${CANDIDATE_BASE}/candidate/jobs`, {
      waitUntil: "networkidle",
    });
    await expect(
      page.getByRole("heading", { name: /job search/i }),
    ).toBeVisible();

    await page
      .getByRole("link", { name: /view details/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/candidate\/jobs\//);

    const signInToApply = page.getByText(/sign in to apply/i).first();
    await expect(signInToApply).toBeVisible();
    await signInToApply.click();

    await expect(
      page.getByRole("heading", { name: /sign in to apply/i }),
    ).toBeVisible();
    await expect(page.getByText(/^sign in$/i)).toBeVisible();
    await expect(page.getByText(/application submitted/i)).toHaveCount(0);
  });

  test("@negative candidate cannot apply to an invalid job id", async ({
    page,
  }) => {
    await login(
      page,
      "candidate",
      users.candidate.email,
      users.candidate.password,
    );

    const invalidJobId = "00000000000000000000000000";
    const res = await authedRequest(
      page,
      "POST",
      `/candidate/jobs/${invalidJobId}/apply`,
    );

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(600);
  });

  test("@negative candidate cannot access admin applications API", async ({
    page,
  }) => {
    await login(
      page,
      "candidate",
      users.candidate.email,
      users.candidate.password,
    );

    const res = await authedRequest(
      page,
      "GET",
      "/admin/applications?page=1&limit=1",
    );
    expect([401, 403]).toContain(res.status);
  });
});
