import { test, expect } from "@playwright/test";

// CSS-pixel coverage, including both sides of the auth layout breakpoints.
const sizes = [
  [320, 568], [360, 640], [375, 667], [390, 844], [412, 915], [430, 932],
  [568, 320], [667, 375], [844, 390], [480, 800], [481, 800],
  [520, 800], [521, 800], [700, 900], [701, 900], [768, 1024],
  [820, 1180], [1024, 768], [1099, 853], [1100, 853], [1135, 853],
  [1280, 720], [1366, 768], [1440, 900], [1920, 1080], [640, 450],
];

for (const locale of ["en", "pt"] as const) {
  for (const route of ["/"]) {
    for (const [width, height] of sizes) {
      test(`${route} ${locale} ${width}x${height}: controls remain accessible`, async ({ page, context }, testInfo) => {
        await context.addCookies([{ name: "fv_learner_locale", value: locale, url: "https://localhost:4318" }]);
        // Provider layout here covers the failure/fallback state, never a real login.
        await page.route("https://accounts.google.com/**", request => request.abort());
        await page.route("https://appleid.cdn-apple.com/**", request => request.abort());
        await page.setViewportSize({ width, height });
        await page.goto(route);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator("html")).toHaveAttribute("lang", locale === "pt" ? "pt-PT" : "en");
        await expect(page.locator(".auth-card")).toBeVisible();
        await expect(page.locator('input[type="email"], input[type="password"]')).toHaveCount(0);
        const layout = await page.evaluate(() => {
          const controls = [...document.querySelectorAll<HTMLElement>(".auth-header a, .auth-header button, .auth-form input, .auth-form button, .auth-social a, .auth-social button, .auth-switch a")]
            .filter(element => element.getClientRects().length && getComputedStyle(element).visibility !== "hidden");
          return {
            width: innerWidth, height: innerHeight,
            scrollWidth: document.documentElement.scrollWidth,
            scrollHeight: document.documentElement.scrollHeight,
            clipped: controls.filter(element => {
              const rect = element.getBoundingClientRect();
              return rect.left < -1 || rect.right > innerWidth + 1 || rect.width < 1 || rect.height < 1;
            }).map(element => element.outerHTML.slice(0, 200)),
            emailGap: (() => {
              const name = document.querySelector('input[name="displayName"]');
              const email = document.querySelector(".auth-email-field");
              return name && email ? email.getBoundingClientRect().top - name.getBoundingClientRect().bottom : null;
            })(),
          };
        });
        await testInfo.attach("layout", { body: JSON.stringify(layout, null, 2), contentType: "application/json" });
        expect(layout.scrollWidth).toBeLessThanOrEqual(width + 1);
        expect(layout.clipped).toEqual([]);
        await page.locator(".auth-footer").scrollIntoViewIfNeeded();
        await expect(page.locator(".auth-footer")).toBeInViewport();
      });
    }
  }
}
