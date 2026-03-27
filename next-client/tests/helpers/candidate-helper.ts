import { expect, type Page } from "@playwright/test";
import { login } from "./auth-helper";
import { users } from "../fixtures/users";

export async function loginAsCandidate(page: Page) {
  await login(
    page,
    "candidate",
    users.candidate.email,
    users.candidate.password,
  );
}

export async function expectCandidateDashboardLoaded(page: Page) {
  await expect(
    page
      .getByRole("heading", { name: /welcome to cataur/i })
      .or(page.getByRole("heading", { name: /hi, /i })),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /^job search$/i })).toBeVisible();
}

export async function expectJobsPageLoaded(page: Page) {
  await expect(
    page.getByRole("heading", { name: /job search/i }),
  ).toBeVisible();
  await expect(page.getByPlaceholder(/job title or company/i)).toBeVisible();
}

export async function expectApplicationsPageLoaded(page: Page) {
  await expect(
    page.getByRole("heading", { name: /my applications/i }),
  ).toBeVisible();
}

export async function expectProfilePageLoaded(page: Page) {
  const onboardingHeading = page.getByRole("heading", {
    name: /basic information/i,
  });
  if ((await onboardingHeading.count()) > 0) {
    await expect(onboardingHeading.first()).toBeVisible();
    return;
  }

  const editProfileBtn = page.getByRole("button", { name: /edit profile/i });
  if ((await editProfileBtn.count()) > 0) {
    await expect(editProfileBtn.first()).toBeVisible();
    return;
  }

  const workExperienceText = page.getByText(/work experience/i);
  if ((await workExperienceText.count()) > 0) {
    await expect(workExperienceText.first()).toBeVisible();
    return;
  }

  throw new Error(
    "Profile page did not render expected onboarding or complete sections",
  );
}
