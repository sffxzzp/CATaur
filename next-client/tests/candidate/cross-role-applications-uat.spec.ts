import { test, expect, type Browser, type Locator, type Page } from "@playwright/test";
import { login } from "../helpers/auth-helper";
import { users } from "../fixtures/users";

/**
 * Cross-role UAT
 *
 * This file validates one complete business lifecycle for a single application:
 * candidate applies -> recruiter schedules interview -> client requests offer
 * -> recruiter moves to offer -> candidate sees offer.
 *
 * The important thing about this test is that all three product-facing roles
 * are asserting against the same underlying application record.
 *
 * Because deployed environments are often missing perfect seed data, this test
 * also contains bootstrap logic that can create a client-linked company and one
 * or more recruiter job orders before the real business flow starts.
 */
const LOCAL_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3001";
const IS_LOCAL = !process.env.PLAYWRIGHT_BASE_URL;

// In deployed environments each role may live on a different subdomain.
const ROLE_BASE_URLS: Record<Role, string> = {
  candidate:
    process.env.CANDIDATE_BASE_URL ||
    process.env.PLAYWRIGHT_CANDIDATE_BASE_URL ||
    LOCAL_BASE_URL,
  admin:
    process.env.ADMIN_BASE_URL ||
    process.env.PLAYWRIGHT_ADMIN_BASE_URL ||
    (IS_LOCAL ? LOCAL_BASE_URL : "http://manager.kawaiimonkey.top"),
  recruiter:
    process.env.RECRUITER_BASE_URL ||
    process.env.PLAYWRIGHT_RECRUITER_BASE_URL ||
    (IS_LOCAL ? LOCAL_BASE_URL : "http://manager.kawaiimonkey.top"),
  client:
    process.env.CLIENT_BASE_URL ||
    process.env.PLAYWRIGHT_CLIENT_BASE_URL ||
    (IS_LOCAL ? LOCAL_BASE_URL : "http://client.kawaiimonkey.top"),
};

type Role = "candidate" | "recruiter" | "client" | "admin";

type ApiListResult<T> = {
  status: number;
  data: T[];
};

type CandidateJob = {
  id: string;
  title?: string;
  company?: {
    name?: string;
  };
};

type ApplicationRecord = {
  id: string;
  status?: string;
  createdAt?: string;
  jobOrderId?: string;
  jobTitle?: string;
  jobOrderTitle?: string;
  clientDecisionType?: string | null;
  clientDecisionNote?: string | null;
  candidate?: {
    email?: string;
    nickname?: string;
    user?: {
      email?: string;
      nickname?: string;
    };
  };
  jobOrder?: {
    id?: string;
    title?: string;
    company?: {
      name?: string;
    };
  };
};

type DecisionRow = {
  id: string;
  candidateName?: string;
  candidateEmail?: string;
  jobOrderTitle?: string;
  clientDecisionType?: string | null;
};

type ClientOrder = {
  id: string;
  title?: string;
  companyId?: string | null;
};

type ApiResult<T = any> = {
  status: number;
  data: T;
};

type AdminUser = {
  id: string;
  email: string;
  nickname?: string;
  role?: string;
};

type CompanyRecord = {
  id: string;
  name: string;
  clientId?: string | null;
};

type RoleSession = {
  context: Awaited<ReturnType<Browser["newContext"]>>;
  page: Page;
};

// Escapes text before it is reused inside RegExp-based locators.
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toIsoDate(displayDate: string) {
  const match = displayDate
    .trim()
    .match(/^([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})$/);
  if (!match) {
    return displayDate;
  }

  const monthMap: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };

  const month = monthMap[match[1].slice(0, 3).toLowerCase()];
  if (!month) {
    return displayDate;
  }

  return `${match[3]}-${month}-${match[2].padStart(2, "0")}`;
}

function toNativeTime(displayTime: string) {
  const match = displayTime
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*([AP]M)(?:\s+[A-Z]{2,5})?$/i);

  if (!match) {
    return displayTime;
  }

  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") {
    hour += 12;
  }

  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

async function isVisible(locator: Locator) {
  try {
    return await locator.isVisible();
  } catch {
    return false;
  }
}

async function fillEditable(locator: Locator, value: string) {
  await expect(locator).toBeVisible();

  try {
    await locator.fill(value);
    return;
  } catch {
    await locator.evaluate((element, nextValue) => {
      const target = element as HTMLInputElement | HTMLTextAreaElement;
      target.focus();
      target.value = nextValue;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
  }
}

function interviewFieldGroup(modal: Locator, labelText: string) {
  const upper = labelText.toUpperCase();

  return modal
    .locator(
      `xpath=.//div[
        (.//*[normalize-space()="${labelText}" or normalize-space()="${upper}"])
        and (.//input or .//textarea or .//*[@role="combobox"] or .//button)
        and not(.//div[
          (.//*[normalize-space()="${labelText}" or normalize-space()="${upper}"])
          and (.//input or .//textarea or .//*[@role="combobox"] or .//button)
        ])
      ]`,
    )
    .first();
}

async function fillInterviewSchedule(
  modal: Locator,
  displayDate: string,
  displayTime: string,
) {
  const nativeDateInput = modal.locator('input[type="date"]').first();
  if (await isVisible(nativeDateInput)) {
    await fillEditable(nativeDateInput, toIsoDate(displayDate));
  } else {
    const legacyDateInput = modal
      .getByPlaceholder(/e\.g\. mar 10, 2026/i)
      .first();
    if (await isVisible(legacyDateInput)) {
      await fillEditable(legacyDateInput, displayDate);
    } else {
      const dateGroup = interviewFieldGroup(modal, "Date");
      const dateInput = dateGroup.locator("input, textarea").first();
      await fillEditable(dateInput, displayDate);
    }
  }

  const nativeTimeInput = modal.locator('input[type="time"]').first();
  if (await isVisible(nativeTimeInput)) {
    await fillEditable(nativeTimeInput, toNativeTime(displayTime));
    return;
  }

  const legacyTimeInput = modal
    .getByPlaceholder(/e\.g\. 2:30 pm est/i)
    .first();
  if (await isVisible(legacyTimeInput)) {
    await fillEditable(legacyTimeInput, displayTime);
    return;
  }

  const timeGroup = interviewFieldGroup(modal, "Time");
  const timeInput = timeGroup.locator("input, textarea").first();
  if (await isVisible(timeInput)) {
    await fillEditable(timeInput, displayTime);
    return;
  }

  const timeSelect = timeGroup.locator("select").first();
  if (await isVisible(timeSelect)) {
    await timeSelect.selectOption({ label: displayTime });
    return;
  }

  const timeTrigger = timeGroup.getByRole("button").first();
  await expect(timeTrigger).toBeVisible();
  await timeTrigger.click();

  const timeOptionPattern = new RegExp(`^${escapeRegExp(displayTime)}$`, "i");
  const timeOption = timeGroup
    .getByRole("button", { name: timeOptionPattern })
    .first()
    .or(modal.getByRole("button", { name: timeOptionPattern }).first());

  await expect(timeOption).toBeVisible();
  await timeOption.click();
}

async function openRoleSession(
  browser: Browser,
  role: Role,
  email: string,
  password: string,
): Promise<RoleSession> {
  const context = await browser.newContext({ baseURL: ROLE_BASE_URLS[role] });
  const page = await context.newPage();
  await login(page, role, email, password);
  return { context, page };
}

/**
 * Generic authenticated list reader for role-scoped APIs returning `{ data: [] }`.
 *
 * We use API reads throughout this UAT to:
 * - discover whether prerequisite data already exists,
 * - poll for status changes after UI actions,
 * - avoid relying on brittle timing-only waits.
 */
async function authedList<T>(
  page: Page,
  path: string,
): Promise<ApiListResult<T>> {
  return page.evaluate(
    async ({ path }) => {
      const token = window.localStorage.getItem("authToken");
      if (!token) {
        return { status: 0, data: [] };
      }

      const res = await fetch(`/api${path}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let body: any = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }

      return {
        status: res.status,
        data: Array.isArray(body?.data) ? body.data : [],
      };
    },
    { path },
  );
}

async function authedRequest<T = any>(
  page: Page,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
): Promise<ApiResult<T>> {
  return page.evaluate(
    async ({ method, path, body }) => {
      const token = window.localStorage.getItem("authToken");
      if (!token) {
        return { status: 0, data: null };
      }

      const res = await fetch(`/api${path}`, {
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
    { method, path, body },
  );
}

// Candidate-side list endpoints used for discovery and verification.
async function fetchCandidateJobs(page: Page) {
  return authedList<CandidateJob>(page, "/candidate/jobs?page=1&limit=100");
}

async function fetchCandidateApplications(page: Page) {
  return authedList<ApplicationRecord>(
    page,
    "/candidate/applications?page=1&limit=200",
  );
}

async function fetchRecruiterApplications(page: Page) {
  return authedList<ApplicationRecord>(
    page,
    "/recruiter/applications?page=1&limit=200",
  );
}

async function fetchClientApplications(page: Page) {
  return authedList<ApplicationRecord>(
    page,
    "/client/applications?page=1&limit=200",
  );
}

async function fetchClientDecisions(page: Page) {
  return authedList<DecisionRow>(page, "/client/decisions?page=1&limit=200");
}

async function fetchClientOrders(page: Page) {
  return authedList<ClientOrder>(page, "/client/orders?limit=100");
}

// Admin is only used to discover the concrete client user record for bootstrap setup.
async function findClientUserByEmail(page: Page, email: string) {
  const result = await authedList<AdminUser>(
    page,
    `/admin/users?page=1&limit=100&role=Client&search=${encodeURIComponent(email)}`,
  );
  return (
    result.data.find(
      (user) => String(user.email).toLowerCase() === email.toLowerCase(),
    ) || null
  );
}

// Bootstrap helper: create a company that is explicitly linked to the target client user.
async function createCompanyForClient(
  recruiterPage: Page,
  clientUserId: string,
  suffix: string,
) {
  const companyName = `UAT Client Company ${suffix}`;
  const response = await authedRequest<{ data?: CompanyRecord }>(
    recruiterPage,
    "POST",
    "/recruiter/companies",
    {
      name: companyName,
      email: `uat-company-${suffix}@example.com`,
      contact: "UAT Contact",
      phone: "+1 555-0100",
      website: "https://example.com",
      locationCountry: "CA",
      locationState: "AB",
      locationCity: "Edmonton",
      keyTechnologies: "Next.js, Playwright",
      clientAccountId: clientUserId,
    },
  );

  const company = (response.data?.data ||
    response.data) as CompanyRecord | null;

  if (response.status >= 400 || !company?.id) {
    throw new Error(
      `Failed to create company for client: ${response.status} ${JSON.stringify(response.data)}`,
    );
  }

  return company;
}

// Bootstrap helper: create a recruiter-managed job order under a chosen company.
async function createJobOrder(
  recruiterPage: Page,
  companyId: string,
  title: string,
) {
  const response = await authedRequest<{ data?: ClientOrder }>(
    recruiterPage,
    "POST",
    "/recruiter/job-orders",
    {
      title,
      companyId,
      locationCountry: "CA",
      locationState: "AB",
      locationCity: "Edmonton",
      salary: "$100k - $130k",
      openings: 1,
      priority: "medium",
      description:
        "## Job Description\n\n- Deliver product features\n- Collaborate with recruiter and client stakeholders\n",
      employmentType: "Full-time",
      workArrangement: "Remote",
      tags: ["Engineering"],
    },
  );

  const jobOrder = (response.data?.data || response.data) as ClientOrder | null;

  if (response.status >= 400 || !jobOrder?.id) {
    throw new Error(
      `Failed to create job order: ${response.status} ${JSON.stringify(response.data)}`,
    );
  }

  return jobOrder;
}

/**
 * Finds the same application across different API response shapes.
 *
 * Some endpoints expose job info as `jobOrder.title`, others as `jobTitle` or
 * `jobOrderTitle`, so we normalize the matching logic here.
 */
function findApplicationForJob(
  applications: ApplicationRecord[],
  candidateEmail: string,
  jobId: string,
  jobTitle?: string,
) {
  return (
    applications.find((application) => {
      const applicationJobId =
        application.jobOrderId || application.jobOrder?.id || "";
      const applicationEmail = String(
        application.candidate?.email ||
          application.candidate?.user?.email ||
          "",
      ).toLowerCase();
      const applicationTitle = String(
        application.jobOrder?.title ||
          application.jobTitle ||
          application.jobOrderTitle ||
          "",
      ).trim();

      const matchesJob =
        (jobId && applicationJobId === jobId) ||
        (!!jobTitle &&
          applicationTitle.toLowerCase() === jobTitle.toLowerCase());

      return matchesJob && applicationEmail === candidateEmail.toLowerCase();
    }) || null
  );
}

test.describe.configure({ mode: "serial" });

test.describe("Cross-role Applications UAT", () => {
  test("candidate, recruiter, and client can see the same application and move it forward", async ({
    browser,
  }) => {
    // This flow does real work across multiple roles and may create fresh data,
    // so it needs a larger timeout than a normal UI test.
    test.setTimeout(120_000);

    // Keep one isolated browser context per role.
    const sessions: RoleSession[] = [];

    try {
      // Role setup:
      // - admin: find the concrete client user id for bootstrap work
      // - recruiter: create companies/jobs and manage application state
      // - candidate: apply and verify candidate-facing status changes
      // - client: review interview-stage applications and request offer
      const admin = await openRoleSession(
        browser,
        "admin",
        users.admin.email,
        users.admin.password,
      );
      sessions.push(admin);

      const recruiter = await openRoleSession(
        browser,
        "recruiter",
        users.recruiter.email,
        users.recruiter.password,
      );
      sessions.push(recruiter);

      const candidate = await openRoleSession(
        browser,
        "candidate",
        users.candidate.email,
        users.candidate.password,
      );
      sessions.push(candidate);

      const client = await openRoleSession(
        browser,
        "client",
        users.client.email,
        users.client.password,
      );
      sessions.push(client);

      const clientOrdersResult = await fetchClientOrders(client.page);
      expect(clientOrdersResult.status).toBeLessThan(400);
      let clientOrders = clientOrdersResult.data;
      let bootstrapClientUserId: string | null = null;

      if (clientOrders.length === 0) {
        // If the deployed client account has no jobs at all, bootstrap a valid
        // client-owned company and a couple of recruiter-owned job orders.
        const clientUser = await findClientUserByEmail(
          admin.page,
          users.client.email,
        );
        expect(
          clientUser?.id,
          "The configured client test user could not be found in admin users.",
        ).toBeTruthy();
        bootstrapClientUserId = clientUser!.id;

        const suffix = Date.now().toString();
        const company = await createCompanyForClient(
          recruiter.page,
          clientUser!.id,
          suffix,
        );

        await createJobOrder(
          recruiter.page,
          company.id,
          `UAT Fullstack Engineer ${suffix}`,
        );
        await createJobOrder(
          recruiter.page,
          company.id,
          `UAT Backend Engineer ${suffix}`,
        );

        await expect
          .poll(async () => {
            const result = await fetchClientOrders(client.page);
            return result.data.length;
          })
          .toBeGreaterThan(0);

        clientOrders = (await fetchClientOrders(client.page)).data;
      }

      expect(
        clientOrders.length,
        "The current client test account still has no visible job orders after recruiter bootstrap.",
      ).toBeGreaterThan(0);

      const [jobsResult, applicationsResult] = await Promise.all([
        fetchCandidateJobs(candidate.page),
        fetchCandidateApplications(candidate.page),
      ]);

      expect(jobsResult.status).toBeLessThan(400);
      expect(applicationsResult.status).toBeLessThan(400);

      const appliedJobIds = new Set(
        applicationsResult.data
          .map(
            (application) => application.jobOrderId || application.jobOrder?.id,
          )
          .filter(Boolean),
      );

      const clientVisibleJobIds = new Set(
        clientOrders.map((job) => job.id).filter(Boolean),
      );

      // Prefer any client-visible job that the candidate has not yet applied to.
      let targetJob = jobsResult.data.find(
        (job) =>
          job.id &&
          clientVisibleJobIds.has(job.id) &&
          !appliedJobIds.has(job.id),
      );

      if (!targetJob) {
        // If the candidate already applied to every client-visible job, create
        // one more fresh client-linked job so this UAT can still exercise the
        // true first-time-application path.
        if (!bootstrapClientUserId) {
          const clientUser = await findClientUserByEmail(
            admin.page,
            users.client.email,
          );
          expect(
            clientUser?.id,
            "The configured client test user could not be found in admin users.",
          ).toBeTruthy();
          bootstrapClientUserId = clientUser!.id;
        }

        const extraSuffix = `${Date.now()}-extra`;
        const extraCompany = await createCompanyForClient(
          recruiter.page,
          bootstrapClientUserId!,
          extraSuffix,
        );
        const createdJob = await createJobOrder(
          recruiter.page,
          extraCompany.id,
          `UAT Fullstack Engineer ${extraSuffix}`,
        );

        await expect
          .poll(async () => {
            const refreshedJobs = await fetchCandidateJobs(candidate.page);
            return refreshedJobs.data.some((job) => job.id === createdJob.id);
          })
          .toBeTruthy();

        const refreshedCandidateJobs = await fetchCandidateJobs(candidate.page);
        targetJob =
          refreshedCandidateJobs.data.find((job) => job.id === createdJob.id) ||
          undefined;
      }

      expect(
        targetJob,
        "No unapplied client-visible job is available for the candidate test user. Reset candidate applications for one of the client's jobs or seed another client-owned job order.",
      ).toBeTruthy();

      const targetJobId = targetJob!.id;
      const targetTitle = targetJob!.title?.trim() || "";
      const targetCompany = targetJob!.company?.name?.trim() || "";

      // Candidate stage: search for the chosen job and apply to it via the real UI.
      await candidate.page.goto("/candidate/jobs", {
        waitUntil: "networkidle",
      });
      await expect(
        candidate.page.getByRole("heading", { name: /job search/i }),
      ).toBeVisible();

      const keywordInput =
        candidate.page.getByPlaceholder(/job title or company/i);
      await keywordInput.fill(targetTitle || targetCompany || targetJobId);
      await keywordInput.press("Enter");

      if (targetTitle) {
        await expect(
          candidate.page
            .getByRole("heading", {
              name: new RegExp(escapeRegExp(targetTitle), "i"),
            })
            .first(),
        ).toBeVisible();
      }

      const targetJobDetailsLink = candidate.page
        .locator(`a[href="/candidate/jobs/${targetJobId}"]`)
        .filter({ hasText: /view details/i })
        .first();

      await expect(targetJobDetailsLink).toBeVisible();
      await targetJobDetailsLink.click();

      await expect(candidate.page).toHaveURL(
        new RegExp(`/candidate/jobs/${escapeRegExp(targetJobId)}$`),
      );

      if (targetTitle) {
        await expect(
          candidate.page
            .getByRole("heading", {
              name: new RegExp(escapeRegExp(targetTitle), "i"),
            })
            .first(),
        ).toBeVisible();
      }

      const submitButton = candidate.page.getByRole("button", {
        name: /submit application/i,
      });
      await expect(submitButton).toBeVisible();
      await submitButton.click();

      await expect(
        candidate.page.getByText(/application submitted/i).first(),
      ).toBeVisible();

      await candidate.page
        .getByRole("link", { name: /view my applications/i })
        .first()
        .click();

      await expect(candidate.page).toHaveURL(/\/candidate\/applications/);
      await expect(
        candidate.page.getByRole("heading", { name: /my applications/i }),
      ).toBeVisible();
      await expect(
        candidate.page.getByText(
          /track the status of your submitted applications/i,
        ),
      ).toBeVisible();

      await expect
        .poll(async () => {
          const result = await fetchCandidateApplications(candidate.page);
          const application = findApplicationForJob(
            result.data,
            users.candidate.email,
            targetJobId,
            targetTitle,
          );
          return application?.status || "";
        })
        .toBe("new");

      const candidateApplicationCard = candidate.page
        .locator(`a[href="/candidate/jobs/${targetJobId}"]`)
        .first()
        .locator("xpath=ancestor::div[contains(@class,'overflow-hidden')]");

      await expect(candidateApplicationCard).toBeVisible();

      if (targetTitle) {
        await expect(
          candidateApplicationCard
            .getByRole("heading", {
              name: new RegExp(escapeRegExp(targetTitle), "i"),
            })
            .first(),
        ).toBeVisible();
      }
      await expect(
        candidateApplicationCard.getByText(/application received/i).first(),
      ).toBeVisible();

      // Recruiter stage:
      // wait until the same application appears in the recruiter-visible pool.
      await expect
        .poll(async () => {
          const result = await fetchRecruiterApplications(recruiter.page);
          const application = findApplicationForJob(
            result.data,
            users.candidate.email,
            targetJobId,
            targetTitle,
          );
          return application?.id || "";
        })
        .not.toBe("");

      const recruiterApplicationId = (
        findApplicationForJob(
          (await fetchRecruiterApplications(recruiter.page)).data,
          users.candidate.email,
          targetJobId,
          targetTitle,
        ) || { id: "" }
      ).id;

      expect(recruiterApplicationId).toBeTruthy();

      // Open the exact recruiter application detail and send an interview invite.
      await recruiter.page.goto(
        `/recruiter/applications/${recruiterApplicationId}`,
        { waitUntil: "networkidle" },
      );

      await expect(
        recruiter.page.getByText(users.candidate.email).first(),
      ).toBeVisible();
      if (targetTitle) {
        await expect(
          recruiter.page
            .getByText(new RegExp(escapeRegExp(targetTitle), "i"))
            .last(),
        ).toBeVisible();
      }

      const interviewButton = recruiter.page.getByRole("button", {
        name: /send interview|send round/i,
      });
      await expect(interviewButton).toBeVisible();
      await interviewButton.click();

      await expect(
        recruiter.page.getByRole("heading", {
          name: /send interview invitation|send round \d+ interview/i,
        }),
      ).toBeVisible();

      const interviewModal = recruiter.page
        .getByRole("heading", {
          name: /send interview invitation|send round \d+ interview/i,
        })
        .locator(
          "xpath=ancestor::*[(self::div or self::section) and .//button[normalize-space()='Send Invitation']][1]",
        );

      const interviewDate = "Apr 21, 2026";
      const interviewTime = "2:30 PM";

      await expect(interviewModal).toBeVisible();
      await fillInterviewSchedule(
        interviewModal,
        interviewDate,
        interviewTime,
      );

      await recruiter.page
        .getByRole("button", { name: /send invitation/i })
        .click();

      await expect
        .poll(async () => {
          const result = await fetchRecruiterApplications(recruiter.page);
          const application = findApplicationForJob(
            result.data,
            users.candidate.email,
            targetJobId,
            targetTitle,
          );
          return application?.status || "";
        })
        .toBe("interview");

      await expect(
        recruiter.page.getByText(/interview invitation/i).first(),
      ).toBeVisible();

      // Candidate should now see the very same application move to interview status.
      await candidate.page.reload({ waitUntil: "networkidle" });
      const candidateInterviewCard = candidate.page
        .locator(`a[href="/candidate/jobs/${targetJobId}"]`)
        .first()
        .locator("xpath=ancestor::div[contains(@class,'overflow-hidden')]");

      if (targetTitle) {
        await expect(
          candidateInterviewCard
            .getByRole("heading", {
              name: new RegExp(escapeRegExp(targetTitle), "i"),
            })
            .first(),
        ).toBeVisible();
      }
      await expect(
        candidateInterviewCard.getByText(/interview scheduled/i).first(),
      ).toBeVisible();

      // Client applications stage:
      // once the recruiter has moved the application to interview, it should
      // become visible to the owning client account.
      await client.page.goto("/client/applications", {
        waitUntil: "networkidle",
      });
      await expect(
        client.page.getByRole("heading", { name: /^applications$/i }),
      ).toBeVisible();

      const clientSearch = client.page.getByPlaceholder(
        /search by name or job title/i,
      );
      await clientSearch.fill(targetTitle);

      await expect
        .poll(async () => {
          const result = await fetchClientApplications(client.page);
          const application = findApplicationForJob(
            result.data,
            users.candidate.email,
            targetJobId,
            targetTitle,
          );
          return application?.status || "";
        })
        .toBe("interview");

      const clientApplicationRow = client.page
        .locator("a")
        .filter({ hasText: users.candidate.email })
        .filter({ hasText: targetTitle })
        .first();

      await expect(clientApplicationRow).toBeVisible();
      await expect(
        clientApplicationRow.getByText(users.candidate.email),
      ).toBeVisible();
      if (targetTitle) {
        await expect(
          clientApplicationRow.getByText(
            new RegExp(escapeRegExp(targetTitle), "i"),
          ),
        ).toBeVisible();
      }

      // Client decisions stage:
      // the client asks the recruiter to proceed with an offer and leaves a note.
      await client.page.goto("/client/decisions", { waitUntil: "networkidle" });
      await expect(
        client.page.getByRole("heading", { name: /^decisions$/i }),
      ).toBeVisible();

      await client.page
        .getByPlaceholder(/search candidates or roles/i)
        .fill(targetTitle);

      await expect
        .poll(async () => {
          const result = await fetchClientDecisions(client.page);
          const decisionRow =
            result.data.find(
              (row) =>
                row.id === recruiterApplicationId ||
                (row.candidateEmail || "").toLowerCase() ===
                  users.candidate.email.toLowerCase(),
            ) || null;
          return decisionRow?.id || "";
        })
        .toBe(recruiterApplicationId);

      const decisionRow = client.page
        .locator("div")
        .filter({ hasText: users.candidate.email })
        .filter({ hasText: targetTitle })
        .first();

      await expect(decisionRow).toBeVisible();
      await decisionRow.getByRole("button", { name: /request offer/i }).click();

      const recruiterNote = "Strong interview feedback from client UAT.";
      await decisionRow.locator("textarea").fill(recruiterNote);

      await client.page.getByRole("button", { name: /submit \(1\)/i }).click();

      // Recruiter should now see the client's decision reflected on the same
      // application record, together with the note.
      await expect
        .poll(async () => {
          const result = await fetchRecruiterApplications(recruiter.page);
          const application = findApplicationForJob(
            result.data,
            users.candidate.email,
            targetJobId,
            targetTitle,
          );
          return application?.clientDecisionType || "";
        })
        .toBe("request-offer");

      await recruiter.page.reload({ waitUntil: "networkidle" });
      await expect(recruiter.page.getByText(/client decision/i)).toBeVisible();
      await expect(recruiter.page.getByText(/offer requested/i)).toBeVisible();
      await expect(recruiter.page.getByText(recruiterNote)).toBeVisible();

      // Recruiter completes the flow by sending the candidate to offer.
      await recruiter.page
        .getByRole("button", { name: /change status/i })
        .click();
      await recruiter.page.getByRole("button", { name: /^offer$/i }).click();

      const offerConfirmButton = recruiter.page
        .getByRole("button", { name: /confirm\s*&?\s*send offer/i })
        .or(recruiter.page.getByRole("button", { name: /^confirm$/i }))
        .first();

      if (await isVisible(offerConfirmButton)) {
        await offerConfirmButton.click();
      }

      await expect
        .poll(async () => {
          const result = await fetchRecruiterApplications(recruiter.page);
          const application = findApplicationForJob(
            result.data,
            users.candidate.email,
            targetJobId,
            targetTitle,
          );
          return application?.status || "";
        })
        .toBe("offer");

      // Candidate gets the final business-visible outcome for that same card.
      await candidate.page.reload({ waitUntil: "networkidle" });
      const candidateOfferCard = candidate.page
        .locator(`a[href="/candidate/jobs/${targetJobId}"]`)
        .first()
        .locator("xpath=ancestor::div[contains(@class,'overflow-hidden')]");

      if (targetTitle) {
        await expect(
          candidateOfferCard
            .getByRole("heading", {
              name: new RegExp(escapeRegExp(targetTitle), "i"),
            })
            .first(),
        ).toBeVisible();
      }
      await expect(
        candidateOfferCard.getByText(/offer received/i).first(),
      ).toBeVisible();
    } finally {
      // Cleanup is best-effort only. If the browser is already closing because of
      // a timeout or failure, we do not want cleanup errors to hide the real cause.
      for (const session of sessions.reverse()) {
        try {
          await session.context.close();
        } catch {
          // Ignore cleanup races if the test already timed out or the browser is closing.
        }
      }
    }
  });
});
