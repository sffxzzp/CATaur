import { expect, type Page } from "@playwright/test";
import { login } from "./auth-helper";
import { users } from "../fixtures/users";

export type RecruiterPageKey =
	| "dashboard"
	| "job-orders"
	| "applications"
	| "candidates"
	| "clients"
	| "reports";

export type RecruiterPageConfig = {
	path: string;
	heading: RegExp;
	markers: RegExp[];
};

export const RECRUITER_PAGE_CONFIG: Record<RecruiterPageKey, RecruiterPageConfig> = {
	dashboard: {
		path: "/recruiter",
		heading: /^Welcome back$/i,
		markers: [/My Job Orders/i, /Recent Applications/i],
	},
	"job-orders": {
		path: "/recruiter/job-orders",
		heading: /^Job Orders$/i,
		markers: [/Search title/i, /^TITLE$/i],
	},
	applications: {
		path: "/recruiter/applications",
		heading: /^Applications$/i,
		markers: [/Search by name or job title/i, /^Interview$/i],
	},
	candidates: {
		path: "/recruiter/candidates",
		heading: /^Candidates$/i,
		markers: [/Add Candidate/i, /Search by name, email or role/i],
	},
	clients: {
		path: "/recruiter/clients",
		heading: /^Companies$/i,
		markers: [/Manage client accounts and relationships/i, /^NAME$/i],
	},
	reports: {
		path: "/recruiter/reports",
		heading: /^Reports\s*&\s*Analytics$/i,
		markers: [/Export Data/i, /Total Job Orders/i],
	},
};

export async function loginAsRecruiter(page: Page) {
	await login(page, "recruiter", users.recruiter.email, users.recruiter.password);
	await expect(page.getByRole("link", { name: /^Dashboard$/i })).toBeVisible();
}

export async function gotoRecruiterPage(page: Page, key: RecruiterPageKey) {
	const config = RECRUITER_PAGE_CONFIG[key];
	await page.goto(config.path, { waitUntil: "networkidle" });
	return config;
}

export async function assertRecruiterPageLoaded(page: Page, key: RecruiterPageKey) {
	const config = RECRUITER_PAGE_CONFIG[key];

	await expect(page).toHaveURL(new RegExp(`${config.path}(?:$|[?#])`));
	await expect(page.getByRole("heading", { name: config.heading }).first()).toBeVisible();

	let matched = false;
	for (const marker of config.markers) {
		try {
			await expect(page.getByText(marker).first()).toBeVisible({ timeout: 3000 });
			matched = true;
			break;
		} catch {
			// Try the next marker to handle small deployed-env UI differences.
		}
	}

	expect(matched, `No marker matched for recruiter page: ${key}`).toBeTruthy();
}
