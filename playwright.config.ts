import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e", workers: 1, fullyParallel: false, forbidOnly: Boolean(process.env.CI), retries: 0,
  reporter: [["list"], ["json", { outputFile: "test-results/browser-results.json" }]],
  // Portable WebKit coverage; native Safari acceptance is recorded separately.
  use: { baseURL: "https://localhost:4318", ...devices["Desktop Safari"], trace: "retain-on-failure", ignoreHTTPSErrors: true },
  webServer: [
    { command: "node e2e/start-fixture.mjs", url: "http://127.0.0.1:4319/health", reuseExistingServer: false, timeout: 20_000 },
    { command: "node e2e/start-learner.mjs", url: "https://localhost:4318/", ignoreHTTPSErrors: true, reuseExistingServer: false, timeout: 30_000,
      env: { API_ORIGIN: "http://127.0.0.1:4319", LEARN_ORIGIN: "https://localhost:4318",
        LEARNER_WEB_SERVICE_KEY: "test-only-service-key", RESEND_API_KEY: "", NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID: "", NEXT_PUBLIC_APPLE_WEB_CLIENT_ID: "" } },
  ],
});
