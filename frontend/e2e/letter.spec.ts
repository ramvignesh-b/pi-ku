import { expect, test } from "@playwright/test";
import pino from "pino";
import { AuthHelper } from "./utils/auth";
import { revealEnvelope } from "./utils/envelope";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

test.describe("Letter Drafting (Real Backend)", () => {
  const password = "Password123!";

  test("should create, store as draft, and persist data", async ({ page }) => {
    const timestamp = Date.now() + Math.random();
    const email = `draft-${timestamp}@example.com`;
    const name = `Draft Author ${timestamp}`;

    await AuthHelper.registerAndLogin(page, email, name, password);

    logger.info(">> [Draft] Navigating to Editor via UI...");
    await page.getByTestId("write-letter-btn").click();

    logger.info(`>> [Draft] Current URL after click: ${page.url()}`);

    // Editor page
    await expect(page.getByTestId("recipient-input")).toBeVisible();
    const recipientInput = page.getByTestId("recipient-input");

    const recipientName = "Dear Friend";
    await recipientInput.fill(recipientName);

    // Initial load: verify textarea value (populated by Fabric when focused)
    const canvasInput = page.locator("textarea");
    await canvasInput.focus();
    await expect(canvasInput).toHaveValue(/Take a deep breath/i);

    // Draft a letter
    logger.info(">> [Draft] Typing content...");
    await canvasInput.focus();
    await page.keyboard.type("This is a secret draft");
    await page.keyboard.press("Enter");
    await page.keyboard.type("It should persist.");
    logger.info(">> [Draft] Clicking Draft...");
    await page.getByTestId("draft-btn").click();

    // Verify Success Modal/Alert
    await expect(page.getByTestId("save-success-toast")).toBeVisible();

    // Verify URL updated with a UUID
    await expect(page).toHaveURL(/\/quill\/[0-9a-f-]{36}/);
    const savedUrl = page.url();
    logger.info(`>> [Draft] Saved URL: ${savedUrl}`);

    // Reload and verify persistence
    logger.info(">> [Draft] Reloading to verify persistence...");
    await page.goto(savedUrl);

    // Wait for initial load overlay to appear and then definitely disappear
    await expect(page.getByTestId("opening-draft-overlay")).toBeHidden();

    // Check recipient
    await expect(page.getByTestId("recipient-input")).toHaveValue(
      recipientName,
    );

    // Check canvas content
    // We wait for the content to appear in the textarea.
    // toHaveValue will poll until it matches or timeouts.
    await canvasInput.focus();
    await expect(canvasInput).toHaveValue(/This is a secret draft/i);
    await expect(canvasInput).toHaveValue(/It should persist/i);
  });

  test("should seal a letter and navigate to Reader, then share on demand", async ({
    page,
  }) => {
    const timestamp = Date.now() + Math.random();
    const email = `seal-${timestamp}@example.com`;
    const name = `Seal Author ${timestamp}`;

    await AuthHelper.registerAndLogin(page, email, name, password);

    logger.info(">> [Seal] Navigating to Editor via UI...");
    await page.getByTestId("write-letter-btn").click();

    const recipientInput = page.getByTestId("recipient-input");
    await recipientInput.fill("A Secret Guest");

    const canvasInput = page.locator("textarea");
    await canvasInput.focus();
    await canvasInput.fill("This letter will be sealed and shared.");

    // Click Seal (open menu, then confirm)
    logger.info(">> [Seal] Clicking Seal...");
    await page.getByTestId("seal-trigger-btn").click();
    await page.getByTestId("seal-confirm-btn").click();

    // Should show sealed confirmation modal
    logger.info(">> [Seal] Verifying sealed modal...");
    await expect(page.getByTestId("post-seal-modal")).toBeVisible();

    // Navigate to Reader via "View letter"
    await page.getByTestId("view-letter-btn").click();

    // Should be on Reader URL
    await expect(page).toHaveURL(/\/read\/[a-f0-9-]{36}$/);

    // Open the envelope to reveal the letter
    await expect(page.getByTestId("decryption-overlay")).toBeHidden();
    // Flip the envelope to show the seal and reveal the letter
    await revealEnvelope(page);
    await expect(page.getByTestId("envelope-letter")).toBeHidden();

    // Share on demand
    logger.info(">> [Seal] Clicking Share button in Reader...");
    await page.getByTestId("share-letter-btn").click();

    // Verify share modal with a valid link
    await expect(page.getByTestId("share-letter-modal")).toBeVisible();
    const linkInput = page.locator("#share-link-input");
    const linkValue = await linkInput.inputValue();
    expect(linkValue).toContain("/read/");
    expect(linkValue).toContain("#");
    logger.info(`>> [Seal] Sharing link: ${linkValue}`);

    await expect(page.getByTestId("copy-link-btn")).toBeVisible();
    // Assuming Close button in ShareModal might need a testid too, but for now let's use text if unique or add testid
    await page.getByTestId("modal-close-btn").click();
    await expect(page.getByTestId("share-letter-modal")).toBeHidden();
  });

  test("should allow author to access sealed letter from drawer without sharing key", async ({
    page,
  }) => {
    const timestamp = Date.now() + Math.random();
    const email = `drawer-${timestamp}@example.com`;
    const name = `Drawer Author ${timestamp}`;
    const recipientName = "Drawer Test Recipient";
    const letterContent = "This is a sealed letter accessed via the drawer.";

    await AuthHelper.registerAndLogin(page, email, name, password);

    logger.info(">> [Drawer] Creating and sealing a letter...");
    await page.getByTestId("write-letter-btn").click();

    const recipientInput = page.getByTestId("recipient-input");
    await recipientInput.fill(recipientName);

    const canvasInput = page.locator("textarea");
    await canvasInput.focus();
    await canvasInput.fill(letterContent);

    // Click Seal (open menu, then confirm)
    await page.getByTestId("seal-trigger-btn").click();
    await page.getByTestId("seal-confirm-btn").click();

    // Sealed modal should appear — click "Keep it" to go to Drawer
    await expect(page.getByTestId("post-seal-modal")).toBeVisible();
    await page.getByTestId("keep-it-btn").click();

    // Open "Kept" section - search for the section with id='kept' and click its toggle button
    logger.info(">> [Drawer] Opening Kept section...");
    await page.getByTestId("drawer-section-kept").click();

    // Find the sealed letter in the drawer by recipient name and click it
    logger.info(">> [Drawer] Clicking sealed letter in drawer...");
    const sealedItem = page
      .getByTestId(/^letter-item-/)
      .filter({ hasText: recipientName })
      .first();
    await sealedItem.click();

    // Verify it opens the Reader without a hash
    logger.info(">> [Drawer] Verifying Reader page...");
    // Give it a bit more time for decryption
    await expect(page).toHaveURL(/\/read\/[a-f0-9-]{36}$/);
    // Reveal and check decrypted content in Reader
    await expect(page.getByTestId("decryption-overlay")).toBeHidden();
    // Flip the envelope and reveal the letter
    await revealEnvelope(page);
    await expect(page.getByTestId("envelope-letter")).toBeHidden();

    // Also check if we are redirected to the Reader if we manually go to the Editor URL
    const readerUrl = page.url();
    const quillUrl = readerUrl.replace("/read/", "/quill/");
    logger.info(
      `>> [Drawer] Navigating to Editor URL (expecting redirect): ${quillUrl}`,
    );
    await page.goto(quillUrl);

    // It should redirect back to the reader
    await expect(page).toHaveURL(readerUrl);
  });
});
