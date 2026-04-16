import path from "node:path";
import process, { env } from "node:process";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import { getBaseUrl } from "./utils/url-builder";

/**
 * Read environment variables from file.
 */
dotenv.config({ path: path.resolve(process.cwd(), "../.env.e2e") });
const baseUrl = getBaseUrl(
  env.SSL_ENABLED === "true",
  env.FRONTEND_DOMAIN,
  env.FRONTEND_PORT,
);

console.log(baseUrl);
export default defineConfig({
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: baseUrl,
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 20000,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    /* Capture screenshot on failure */
    screenshot: "only-on-failure",
    /* Capture video on failure */
    video: "retain-on-failure",
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "bun run dev -- --mode e2e",
    url: getBaseUrl(
      process.env.SSL_ENABLED === "true",
      process.env.FRONTEND_DOMAIN,
      process.env.FRONTEND_PORT,
    ),
    reuseExistingServer: !process.env.CI,
    ignoreHTTPSErrors: true,
  },
});
