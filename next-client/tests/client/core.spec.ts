import { expect, test } from "@playwright/test";
import { login } from "../helpers/auth-helper";
import { users } from "../fixtures/users";

async function loginClient(page: Parameters<typeof login>[0]) {
  await login(page, "client", users.client.email, users.client.password);
}

test.describe("Client Core Flow", () => {
  test("@positive real decisions page loads with core modules", async ({
    page,
  }) => {
    await loginClient(page);
    await page.goto("/client/decisions", { waitUntil: "networkidle" });

    await expect(
      page.getByRole("heading", { name: /^Decisions$/i }),
    ).toBeVisible();
    await expect(page.getByText(/^Pending$/i).first()).toBeVisible();
    await expect(page.getByText(/How this works/i)).toBeVisible();
  });

  test("@defect real applications search uses legacy query key", async ({
    page,
  }) => {
    await loginClient(page);
    await page.goto("/client/applications", { waitUntil: "networkidle" });

    await page.getByRole("button", { name: /^Interview$/i }).click();
    const keyword = "e2e-real-filter-check";
    const reqWithSearchPromise = page.waitForRequest(
      (req) => {
        if (!req.url().includes("/api/client/applications")) return false;
        const url = new URL(req.url());
        const hasKeyword =
          url.searchParams.get("candidateNameOrJobTitle") === keyword ||
          url.searchParams.get("search") === keyword;

        return url.searchParams.get("status") === "interview" && hasKeyword;
      },
      { timeout: 15000 },
    );

    await page.getByPlaceholder(/search by name or job title/i).fill(keyword);

    const reqWithSearch = await reqWithSearchPromise;

    const reqUrl = new URL(reqWithSearch.url());
    expect(reqUrl.searchParams.get("status")).toBe("interview");

    // Defect verification: search keyword is sent via `search`,
    // while backend expects `candidateNameOrJobTitle`.
    expect(reqUrl.searchParams.get("search")).toBe(keyword);
    expect(reqUrl.searchParams.get("candidateNameOrJobTitle")).toBeNull();
  });

  test("@negative real applications empty search is handled safely", async ({
    page,
  }) => {
    await loginClient(page);
    await page.goto("/client/applications", { waitUntil: "domcontentloaded" });

    await page
      .getByPlaceholder(/search by name or job title/i)
      .fill("__definitely_no_match_09a3b7f1__");

    await expect(
      page.getByText(/no applications match your filters/i),
    ).toBeVisible();
  });

  test("@positive real dashboard shows core KPI modules", async ({ page }) => {
    await loginClient(page);
    await page.goto("/client", { waitUntil: "networkidle" });

    await expect(page.getByText(/active job orders/i)).toBeVisible();
    await expect(page.getByText(/total candidates/i)).toBeVisible();
    await expect(page.getByText(/offers in progress/i)).toBeVisible();
  });

  test("@positive real decisions local selection toggles submit state", async ({
    page,
  }) => {
    await loginClient(page);
    await page.goto("/client/decisions", { waitUntil: "networkidle" });

    const requestOffer = page
      .getByRole("button", { name: /request offer/i })
      .first();
    if ((await requestOffer.count()) === 0) {
      await expect(
        page.getByText(/no interview-stage candidates yet/i),
      ).toBeVisible();
      return;
    }

    await requestOffer.click();
    await expect(
      page.getByRole("button", { name: /submit \(1\)/i }),
    ).toBeVisible();

    await page.locator('button[title="Clear decision"]').first().click();
    await expect(
      page.getByRole("button", { name: /submit \(1\)/i }),
    ).toHaveCount(0);
  });

  test("@negative real decisions search sends expected query params", async ({
    page,
  }) => {
    await loginClient(page);
    await page.goto("/client/decisions", { waitUntil: "networkidle" });

    const keyword = "e2e-real-decision-search";
    await page.getByPlaceholder(/search candidates or roles/i).fill(keyword);

    const reqWithSearch = await page.waitForRequest(
      (req) => {
        if (!req.url().includes("/api/client/decisions")) return false;
        const url = new URL(req.url());
        return url.searchParams.get("candidateNameOrJobOrderTitle") === keyword;
      },
      { timeout: 10000 },
    );

    const reqUrl = new URL(reqWithSearch.url());
    expect(reqUrl.searchParams.get("candidateNameOrJobOrderTitle")).toBe(
      keyword,
    );
  });

  test("@defect real orders page uses plural `statuses` instead of singular `status`", async ({
    page,
  }) => {
    await loginClient(page);
    await page.goto("/client/orders", { waitUntil: "networkidle" });

    // Wait for the Active filter button to be visible
    await expect(page.getByRole("button", { name: /^Active$/i })).toBeVisible({
      timeout: 10000,
    });

    // Listen for the API request when clicking "Active" filter
    const reqWithStatusPromise = page.waitForRequest(
      (req) => {
        if (!req.url().includes("/client/orders")) return false;
        const url = new URL(req.url());
        // Check if URL contains "statuses" (the defect) instead of "status"
        return url.searchParams.has("statuses");
      },
      { timeout: 15000 },
    );

    // Click "Active" filter to trigger the API request
    await page.getByRole("button", { name: /^Active$/i }).click();

    const reqWithStatus = await reqWithStatusPromise;
    const reqUrl = new URL(reqWithStatus.url());

    // Defect verification: frontend sends `statuses` (plural, multiple values)
    // while backend expects `status` (singular, single value)
    const statusesParams = reqUrl.searchParams.getAll("statuses");
    expect(statusesParams.length).toBeGreaterThan(0);

    // Backend receives multiple `statuses` params but ignores them
    // because it looks for `status` (singular)
    expect(reqUrl.searchParams.get("status")).toBeNull();

    console.warn(
      "⚠️  DEFECT DETECTED: Orders page sends multiple 'statuses' but backend expects 'status'",
    );
  });
});
