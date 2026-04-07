import { test, expect, type Page } from "@playwright/test";
import { users } from "../fixtures/users";

const CANDIDATE_BASE = "http://candidate.kawaiimonkey.top";
const RECRUITER_BASE = "http://manager.kawaiimonkey.top";

type ApiResult = {
  status: number;
  data: any;
};

type ApplicationRecord = {
  id: string;
  createdAt?: string;
  jobOrderId?: string;
  candidate?: { email?: string };
  jobOrder?: { id?: string; title?: string };
};

async function loginAt(
  page: Page,
  baseUrl: string,
  role: "candidate" | "recruiter" | "admin",
  email: string,
  password: string,
) {
  await page.goto(`${baseUrl}/login?role=${role}`, {
    waitUntil: "networkidle",
  });

  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: /sign in|login/i }).click();

  await expect(page).not.toHaveURL(/\/login(\?|$)/, { timeout: 15000 });
}

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

async function cleanupDuplicateApplicationsForCandidate(
  page: Page,
  candidateEmail: string,
) {
  const result = await authedRequest(
    page,
    "GET",
    `/admin/applications?page=1&limit=200&search=${encodeURIComponent(candidateEmail)}`,
  );

  if (result.status >= 400) {
    throw new Error(`Unable to list admin applications: ${result.status}`);
  }

  const rows = (
    Array.isArray(result.data?.data) ? result.data.data : []
  ) as ApplicationRecord[];
  const exact = rows.filter(
    (row) =>
      String(row.candidate?.email ?? "").toLowerCase() ===
      candidateEmail.toLowerCase(),
  );

  const grouped = new Map<string, ApplicationRecord[]>();
  for (const row of exact) {
    const key = row.jobOrderId ?? row.jobOrder?.id;
    if (!key) continue;
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }

  for (const [, apps] of grouped) {
    const sorted = apps.sort((a, b) => {
      const ta = new Date(a.createdAt ?? 0).getTime();
      const tb = new Date(b.createdAt ?? 0).getTime();
      return tb - ta;
    });

    for (const dupe of sorted.slice(1)) {
      if (!dupe.id) continue;
      const del = await authedRequest(
        page,
        "DELETE",
        `/admin/applications/${dupe.id}`,
      );
      if (del.status >= 400 && del.status !== 404) {
        throw new Error(
          `Failed deleting duplicate application ${dupe.id}: ${del.status}`,
        );
      }
    }
  }
}

async function findCandidateApplicationByTitle(
  page: Page,
  title: string,
): Promise<ApplicationRecord | null> {
  const result = await authedRequest(
    page,
    "GET",
    "/candidate/applications?page=1&limit=200",
  );
  if (result.status >= 400) return null;

  const rows = (
    Array.isArray(result.data?.data) ? result.data.data : []
  ) as ApplicationRecord[];
  return (
    rows.find((row) => {
      const jobTitle = String(row.jobOrder?.title ?? "").trim();
      return jobTitle.toLowerCase() === title.toLowerCase();
    }) ?? null
  );
}

test.describe("Candidate Apply -> Recruiter Verify Flow", () => {
  test("candidate can search job and recruiter can find the application", async ({
    page,
    context,
  }) => {
    const adminPage = await context.newPage();
    await loginAt(
      adminPage,
      RECRUITER_BASE,
      "admin",
      users.admin.email,
      users.admin.password,
    );
    await cleanupDuplicateApplicationsForCandidate(
      adminPage,
      users.candidate.email,
    );

    await loginAt(
      page,
      CANDIDATE_BASE,
      "candidate",
      users.candidate.email,
      users.candidate.password,
    );

    await page.goto(`${CANDIDATE_BASE}/candidate/jobs`, {
      waitUntil: "networkidle",
    });
    await expect(
      page.getByRole("heading", { name: /job search/i }),
    ).toBeVisible();

    const firstJobTitle = page.locator("h3").first();
    await expect(firstJobTitle).toBeVisible();
    const seedTitle = (await firstJobTitle.innerText()).trim();

    const searchInput = page.getByPlaceholder(/job title or company/i);
    await searchInput.fill(seedTitle.split(" ")[0] ?? seedTitle);
    await searchInput.press("Enter");

    await page
      .getByRole("link", { name: /view details/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/candidate\/jobs\//);

    const detailTitle = (await page.locator("h1").first().innerText()).trim();
    await expect(
      page.getByRole("heading", { name: detailTitle }),
    ).toBeVisible();

    const submitButton = page.getByRole("button", {
      name: /submit application/i,
    });

    if ((await submitButton.count()) > 0) {
      await submitButton.click();
      await expect(
        page.getByText(/application submitted/i).first(),
      ).toBeVisible({
        timeout: 15000,
      });
    }

    const viewMyApplications = page.getByRole("link", {
      name: /view my applications/i,
    });
    if ((await viewMyApplications.count()) > 0) {
      await viewMyApplications.first().click();
      await expect(page).toHaveURL(/\/candidate\/applications/);
    }

    const candidateApplication = await findCandidateApplicationByTitle(
      page,
      detailTitle,
    );
    if (candidateApplication?.jobOrderId) {
      const secondApply = await authedRequest(
        page,
        "POST",
        `/candidate/jobs/${candidateApplication.jobOrderId}/apply`,
      );
      expect([201, 409]).toContain(secondApply.status);

      if (secondApply.status === 201) {
        await cleanupDuplicateApplicationsForCandidate(
          adminPage,
          users.candidate.email,
        );
      }
    }

    const recruiterPage = await context.newPage();
    await loginAt(
      recruiterPage,
      RECRUITER_BASE,
      "recruiter",
      users.recruiter.email,
      users.recruiter.password,
    );

    await recruiterPage.goto(`${RECRUITER_BASE}/recruiter/applications`, {
      waitUntil: "networkidle",
    });
    await expect(
      recruiterPage.getByRole("heading", { name: /applications/i }),
    ).toBeVisible();

    const recruiterSearch = recruiterPage.getByPlaceholder(
      /search by name or job title/i,
    );
    await recruiterSearch.fill(detailTitle.slice(0, 30));

    await expect(
      recruiterPage.getByText(users.candidate.email).first(),
    ).toBeVisible({
      timeout: 20000,
    });

    const titleNeedle = detailTitle.split(" ").slice(0, 4).join(" ");
    const matchedRows = recruiterPage
      .locator("div")
      .filter({ hasText: users.candidate.email })
      .filter({ hasText: titleNeedle });

    await expect(matchedRows.first()).toBeVisible({ timeout: 20000 });
    await expect(matchedRows.first()).toContainText(/self-applied/i);
  });
});
