import { test } from "@playwright/test";
import {
  assertRecruiterPageLoaded,
  gotoRecruiterPage,
  loginAsRecruiter,
  type RecruiterPageKey,
} from "../helpers/recruiter-helper";

const pages: Array<{ key: RecruiterPageKey; navLabel: RegExp }> = [
  { key: "dashboard", navLabel: /^Dashboard$/i },
  { key: "job-orders", navLabel: /^Job Orders$/i },
  { key: "applications", navLabel: /^Applications$/i },
  { key: "candidates", navLabel: /^Candidates$/i },
  { key: "clients", navLabel: /^Companies$/i },
  { key: "reports", navLabel: /^Reports$/i },
];

test.describe("Recruiter Pages Smoke", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRecruiter(page);
  });

  for (const pageConfig of pages) {
    test(`@smoke recruiter page loads: ${pageConfig.key}`, async ({ page }) => {
      await gotoRecruiterPage(page, pageConfig.key);
      await assertRecruiterPageLoaded(page, pageConfig.key);

      // Verify sidebar navigation entry is available for this page.
      await page
        .getByRole("link", { name: pageConfig.navLabel })
        .first()
        .scrollIntoViewIfNeeded();
    });
  }
});
