import { expect, type Page } from "@playwright/test";
import pino from "pino";
import { MailpitHelper } from "./mailpit";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

/**
 * Completes the full registration -> activation -> login cycle.
 */
async function registerAndLogin(
  page: Page,
  email: string,
  fullName: string,
  password: string,
) {
  // Register the User
  logger.info(`[Auth] Registering user: ${email}`);
  await page.goto("/onboard");
  await page.getByLabel(/pen name/i).fill(fullName);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel(/confirm password/i).fill(password);
  await page.getByRole("button", { name: /^register$/i }).click();

  await expect(page).toHaveURL(/\/verify-email/);

  // Get activation URL from Mailpit and activate user
  logger.info(`[Auth] Polling Mailpit for activation email...`);
  const activationLink = await MailpitHelper.getActivationLink(email);

  await page.goto(activationLink);

  await expect(page.getByText(/account activated/i)).toBeVisible();
  await page.getByRole("button", { name: /start writing/i }).click();

  // Dismiss the Welcom Modal and Perform Login
  logger.info(`[Auth] Logging in...`);
  await expect(page).toHaveURL(/\/login/);

  const welcomeButton = page.getByRole("button", { name: /I'll remember/i });
  await welcomeButton.waitFor({ state: "visible", timeout: 10000 });
  await welcomeButton.click();
  await expect(welcomeButton).toBeHidden();

  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/drawer/);
  logger.info(`[Auth] Successfully authenticated ${email}`);
}
export const AuthHelper = { registerAndLogin };
