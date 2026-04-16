import { test, expect, type Page } from "@playwright/test";
import {
  expectApplicationsPageLoaded,
  expectJobsPageLoaded,
  loginAsCandidate,
} from "../helpers/candidate-helper";

/**
 * Candidate-only UAT
 *
 * Purpose:
 * - Validate the candidate's own business journey without involving recruiter/client.
 * - Cover the happy path of "find a job -> apply -> see that exact application in My Applications".
 *
 * Why this file still matters even though we also have a cross-role UAT:
 * - It is much faster than the multi-role test.
 * - It isolates candidate-side regressions from recruiter/client-side regressions.
 * - It is the best place to debug "candidate can apply but cannot see the result" problems.
 */
type ApiListResult<T> = {
  status: number;
  data: T[];
};

type CandidateApplication = {
  id: string;
  status?: string;
  createdAt?: string;
  jobOrderId?: string;
  jobOrder?: {
    id?: string;
    title?: string;
    company?: {
      name?: string;
    };
  };
};

type CandidateJob = {
  id: string;
  title?: string;
  company?: {
    name?: string;
  };
};

/**
 * Small authenticated list helper used by this test only.
 *
 * We read data through the same browser session after login so we can:
 * - discover which jobs are available right now,
 * - discover which jobs were already applied to by the candidate account,
 * - avoid hard-coding unstable test data.
 */
async function authedList<T>(page: Page, path: string): Promise<ApiListResult<T>> {
  return page.evaluate(async ({ path }) => {
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
  }, { path });
}

async function fetchCandidateApplications(page: Page) {
  return authedList<CandidateApplication>(
    page,
    "/candidate/applications?page=1&limit=100",
  );
}

async function fetchCandidateJobs(page: Page) {
  return authedList<CandidateJob>(page, "/candidate/jobs?page=1&limit=100");
}

// Escapes user/content-derived text before putting it into a RegExp selector.
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test.describe("Candidate Applications UAT", () => {
  test("candidate can submit an application and track it from My Applications", async ({
    page,
  }) => {
    // Step 1: log in and inspect the candidate's current state before we touch the UI.
    // We intentionally do not assume any fixed job title exists in the environment.
    await loginAsCandidate(page);
    const [jobsResult, applicationsResult] = await Promise.all([
      fetchCandidateJobs(page),
      fetchCandidateApplications(page),
    ]);

    await expect(
      jobsResult.status,
      "candidate jobs API should be available for the UAT flow",
    ).toBeLessThan(400);
    await expect(
      applicationsResult.status,
      "candidate applications API should be available for the UAT flow",
    ).toBeLessThan(400);

    const jobs = jobsResult.data as CandidateJob[];
    const applications = applicationsResult.data as CandidateApplication[];

    // Build a set of already-applied jobs so we can prefer a "fresh" job.
    // This keeps the UAT closer to a real first-time apply journey.
    const appliedJobIds = new Set(
      applications.map((application) => application.jobOrderId).filter(Boolean),
    );

    const targetNewJob =
      jobs.find((job) => job.id && !appliedJobIds.has(job.id)) ?? null;

    await page.goto("/candidate/jobs", { waitUntil: "networkidle" });
    await expectJobsPageLoaded(page);

    let targetJobId = "";
    let targetTitle = "";
    let targetCompany = "";

    if (targetNewJob?.id) {
      // Happy path:
      // pick any currently visible job that this candidate has not already applied to.
      targetJobId = targetNewJob.id;
      targetTitle = targetNewJob.title?.trim() || "";
      targetCompany = targetNewJob.company?.name?.trim() || "";

      const keywordInput = page.getByPlaceholder(/job title or company/i);
      await keywordInput.fill(targetTitle || targetCompany || targetJobId);
      await keywordInput.press("Enter");

      if (targetTitle) {
        await expect(
          page.getByRole("heading", {
            name: new RegExp(escapeRegExp(targetTitle), "i"),
          }).first(),
        ).toBeVisible();
      }

      // Important:
      // after searching, we do NOT click the first "View Details" link on the page.
      // The page can contain many similar titles/statuses, so we lock onto the exact
      // job by its unique detail URL.
      const targetJobDetailsLink = page
        .locator(`a[href="/candidate/jobs/${targetJobId}"]`)
        .filter({ hasText: /view details/i })
        .first();

      await expect(targetJobDetailsLink).toBeVisible();
      await targetJobDetailsLink.click();
      await expect(page).toHaveURL(new RegExp(`/candidate/jobs/${targetJobId}$`));

      if (targetTitle) {
        await expect(
          page.getByRole("heading", {
            name: new RegExp(escapeRegExp(targetTitle), "i"),
          }),
        ).toBeVisible();
      }
      if (targetCompany) {
        await expect(page.getByText(new RegExp(escapeRegExp(targetCompany), "i"))).toBeVisible();
      }

      const submitButton = page.getByRole("button", {
        name: /submit application/i,
      });
      await expect(submitButton).toBeVisible();
      await submitButton.click();

      // The product can surface "application submitted" in more than one UI shape.
      // We support both:
      // - success modal flow,
      // - already-applied/success panel flow.
      const successTitle = page.getByText(/application submitted/i).first();
      const appliedPanelTitle = page.getByText(/application submitted/i).nth(1);

      if (await successTitle.isVisible().catch(() => false)) {
        await expect(
          page.getByText(/track your application status in the applications tab/i),
        ).toBeVisible();
        await page
          .getByRole("link", { name: /view my applications/i })
          .first()
          .click();
      } else {
        await expect(appliedPanelTitle).toBeVisible();
        await page
          .getByRole("link", { name: /view my applications/i })
          .first()
          .click();
      }
    } else {
      // Fallback path:
      // if the account has already applied to every visible job, we still verify
      // that an existing application can be tracked from My Applications.
      const existingApplication = applications[0];
      expect(
        existingApplication,
        "the fallback path requires at least one existing application",
      ).toBeTruthy();

      targetJobId =
        existingApplication?.jobOrderId || existingApplication?.jobOrder?.id || "";
      targetTitle = existingApplication?.jobOrder?.title?.trim() || "";
      targetCompany =
        existingApplication?.jobOrder?.company?.name?.trim() || "";

      await page.goto("/candidate/applications", { waitUntil: "networkidle" });
    }

    await expectApplicationsPageLoaded(page);
    await expect(
      page.getByText(/track the status of your submitted applications/i),
    ).toBeVisible();

    if (targetJobId) {
      // Confirm through the API that the specific target job now exists in the
      // candidate's application list before we make UI assertions.
      await expect
        .poll(async () => {
          const result = await fetchCandidateApplications(page);
          return result.data.some((application) => {
            const id = application.jobOrderId || application.jobOrder?.id;
            return id === targetJobId;
          });
        })
        .toBeTruthy();
    }

    // Critical test design decision:
    // we anchor all application assertions to the unique View Job href for the
    // target job. The page can contain many cards with the same company, same
    // title, or same status label, so page-wide selectors would be flaky.
    const targetApplicationCard = targetJobId
      ? page
          .locator(`a[href="/candidate/jobs/${targetJobId}"]`)
          .first()
          .locator("xpath=ancestor::div[contains(@class,'overflow-hidden')]")
      : null;

    if (targetApplicationCard) {
      await expect(targetApplicationCard).toBeVisible();
    }

    if (targetTitle) {
      if (targetApplicationCard) {
        await expect(
          targetApplicationCard.getByRole("heading", {
            name: new RegExp(escapeRegExp(targetTitle), "i"),
          }).first(),
        ).toBeVisible();
      } else {
        await expect(
          page.getByRole("heading", {
            name: new RegExp(escapeRegExp(targetTitle), "i"),
          }).first(),
        ).toBeVisible();
      }
    }

    if (targetCompany) {
      if (targetApplicationCard) {
        await expect(
          targetApplicationCard.getByText(
            new RegExp(escapeRegExp(targetCompany), "i"),
          ).first(),
        ).toBeVisible();
      } else {
        await expect(
          page.getByText(new RegExp(escapeRegExp(targetCompany), "i")).first(),
        ).toBeVisible();
      }
    }

    if (targetApplicationCard) {
      await expect(targetApplicationCard.getByText(/applied /i).first()).toBeVisible();

      await expect(
        targetApplicationCard
          .getByText(/application received/i)
          .or(targetApplicationCard.getByText(/interview scheduled/i))
          .or(targetApplicationCard.getByText(/offer received/i))
          .or(targetApplicationCard.getByText(/position filled/i)),
      ).toBeVisible();
    } else {
      await expect(page.getByText(/applied /i).first()).toBeVisible();

      await expect(
        page
          .getByText(/application received/i)
          .or(page.getByText(/interview scheduled/i))
          .or(page.getByText(/offer received/i))
          .or(page.getByText(/position filled/i)),
      ).toBeVisible();
    }

    const targetViewJobLink = targetJobId
      ? page.locator(`a[href="/candidate/jobs/${targetJobId}"]`).first()
      : page.getByRole("link", { name: /view job/i }).first();

    // Final proof:
    // the application is not only visible in My Applications, but the "View Job"
    // action from that exact card still leads back to the expected job detail page.
    await expect(targetViewJobLink).toBeVisible();
    await targetViewJobLink.click();

    await expect(page).toHaveURL(/\/candidate\/jobs\//);
    if (targetTitle) {
      await expect(
        page.getByRole("heading", {
          name: new RegExp(escapeRegExp(targetTitle), "i"),
        }),
      ).toBeVisible();
    } else {
      await expect(page.getByRole("heading").first()).toBeVisible();
    }
  });
});
