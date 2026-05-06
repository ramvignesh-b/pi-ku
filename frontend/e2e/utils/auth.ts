import { expect, type Page } from "@playwright/test";
import pino from "pino";
import { MailpitHelper } from "./mailpit";
import { handleWelcomeLetter } from "./envelope";

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
  await page.getByTestId("pen-name-input").fill(fullName);
  await page.getByTestId("email-input").fill(email);
  await page.getByTestId("password-input").fill(password);
  await page.getByTestId("confirm-password-input").fill(password);
  await page.getByTestId("register-submit-btn").click();

  await expect(page).toHaveURL(/\/verify-email/);

  // Get activation URL from Mailpit and activate user
  logger.info(`[Auth] Polling Mailpit for activation email...`);
  const activationLink = await MailpitHelper.getActivationLink(email);

  await page.goto(activationLink);

  await expect(page.getByTestId("activation-success-header")).toBeVisible();
  await page.getByTestId("start-writing-btn").click();

  // Dismiss the Welcom Modal and Perform Login
  logger.info(`[Auth] Logging in...`);
  await expect(page).toHaveURL(/\/login/);

  await page.getByTestId("welcome-dismiss-btn").click();
  await expect(page.getByTestId("welcome-dismiss-btn")).toBeHidden();

  await page.getByTestId("email-input").fill(email);
  await page.getByTestId("password-input").fill(password);
  await page.getByTestId("login-submit-btn").click();

  await expect(page).toHaveURL(/\/drawer/);
  await handleWelcomeLetter(page);
  logger.info(`[Auth] Successfully authenticated ${email}`);
}

export const AuthHelper = { registerAndLogin };
