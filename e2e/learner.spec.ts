import { test, expect, type Page } from "@playwright/test";

async function register(page: Page, email = "first@example.test") {
  await page.goto("/create-account");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText("Progress saved to your account.", { exact: true })).toBeVisible();
}

async function finishFirstLesson(page: Page) {
  await page.goto("/academy/1/1");
  await page.getByRole("button", { name: "Translation one", exact: true }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByText("Lesson complete", { exact: true })).toBeVisible();
}

test.beforeEach(async ({ request }) => { await request.post("http://127.0.0.1:4319/_test/reset"); });

test("guest lesson survives navigation and refresh; later units and skipped lessons stay locked", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/try");
  await finishFirstLesson(page);
  await expect(page.getByText("Lesson saved on this browser.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Back to course map", exact: true }).click();
  await expect(page.getByText("Completed", { exact: true })).toHaveCount(1);
  await page.reload();
  await expect(page.getByText("Completed", { exact: true })).toHaveCount(1);
  await page.goto("/academy/2/1");
  await expect(page).toHaveURL(/\/home$/);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("guest claim persists to the account; logout and another account cannot inherit it", async ({ page }) => {
  await page.goto("/try");
  await finishFirstLesson(page);
  await expect(page.getByText("Lesson saved on this browser.", { exact: true })).toBeVisible();
  await register(page);
  await page.getByRole("button", { name: "Save guest lessons to this account", exact: true }).click();
  await expect(page.getByText("Completed", { exact: true })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Save guest lessons to this account", exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("Completed", { exact: true })).toHaveCount(1);
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL("/");
  await register(page, "second@example.test");
  await expect(page.getByText("Completed", { exact: true })).toHaveCount(0);
});

test("failed cloud saves retain an outbox through refresh and recover on retry", async ({ page, request }) => {
  await register(page);
  await request.post("http://127.0.0.1:4319/_test/fail-writes", { data: { enabled: true } });
  await finishFirstLesson(page);
  await expect(page.getByText("Saved on this browser. Use Retry sync to save to your account.", { exact: true })).toBeVisible();
  await page.goto("/home");
  await page.reload();
  await expect(page.getByText("Completed", { exact: true })).toHaveCount(1);
  await request.post("http://127.0.0.1:4319/_test/fail-writes", { data: { enabled: false } });
  await page.getByRole("button", { name: "Retry sync", exact: true }).click();
  await expect(page.getByText("Progress saved to your account.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Completed", { exact: true })).toHaveCount(1);
});

test("invalid cookie cannot unlock accounts and is cleared without a redirect loop", async ({ page, context }) => {
  await context.addCookies([{ name: "fv_learner_session", value: "arbitrary", url: "https://localhost:4318", httpOnly: true }]);
  await page.goto("/home");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Log in", exact: true })).toBeVisible();
  expect((await context.cookies()).some(cookie => cookie.name === "fv_learner_session")).toBe(false);
  await expect(page.locator('script[src*="accounts.google.com"], script[src*="appleid.cdn-apple.com"]')).toHaveCount(0);
});

test("profile edit, private export and password-confirmed deletion work with the backend contract", async ({ page }) => {
  await register(page);
  await page.goto("/account");
  await page.getByLabel("Name", { exact: true }).fill("Updated fixture learner");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByText("Profile saved.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Updated fixture learner");
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download account and study data", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("forrovivo-learning-data.json");
  await page.getByLabel("Current password", { exact: true }).fill("fixture-password");
  await page.getByLabel("Type DELETE to confirm", { exact: true }).fill("DELETE");
  await page.getByRole("button", { name: "Delete my account", exact: true }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/account");
  await expect(page).toHaveURL("/");
});
