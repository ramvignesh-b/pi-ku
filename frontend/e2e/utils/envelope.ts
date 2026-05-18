import { expect, type Page } from "@playwright/test";
import pino from "pino";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

/**
 * Reveal a letter from an envelope.
 */
export async function revealEnvelope(page: Page) {
  logger.info("[Envelope] Revealing envelope...");
  // Click envelope to flip
  await page.getByTestId("envelope-front").click();

  // Click seal to open flap
  await page.getByTestId("wax-seal").click();

  // Click letter to reveal
  await page
    .getByTestId("envelope-letter")
    .click({ position: { x: 30, y: 15 } });
}

/**
 * Handles and dismisses the first welcome letter
 */
export async function handleWelcomeLetter(page: Page) {
  logger.info("[Envelope] Handling Welcome Letter...");
  await revealEnvelope(page);

  // Click "I'll see you" button
  await page.getByTestId("dismiss-welcome-letter-btn").click();
  await expect(page.getByTestId("dismiss-welcome-letter-btn")).toBeHidden();
}
