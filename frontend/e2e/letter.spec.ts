import { expect, test } from "@playwright/test";
import pino from "pino";
import { AuthHelper } from "./utils/auth";

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
    await page.getByRole("button", { name: /write something/i }).click();

    logger.info(`>> [Draft] Current URL after click: ${page.url()}`);

    // Wait for the recipient input to be present in the DOM
    const recipientInput = page.locator("#recipient");
    await recipientInput.waitFor({ state: "visible", timeout: 20000 });

    const recipientName = "Dear Friend";
    await recipientInput.fill(recipientName);

    // Initial load: verify textarea value (populated by Fabric when focused)
    const canvasInput = page.getByLabel("Canvas text input");
    await canvasInput.waitFor({ state: "attached" });
    await canvasInput.focus();
    await expect(canvasInput).toHaveValue(/Take a deep breath/i);

    // Draft a letter
    logger.info(">> [Draft] Typing content...");
    await canvasInput.focus();
    await page.keyboard.type("This is a secret draft");
    await page.keyboard.press("Enter");
    await page.keyboard.type("It should persist.");
    logger.info(">> [Draft] Clicking Store...");
    await page.getByRole("button", { name: /store/i }).click();

    // Verify Success Modal/Alert
    await expect(page.getByText(/your letter is saved/i)).toBeVisible();

    // Verify URL updated with a UUID
    await expect(page).toHaveURL(/\/quill\/[0-9a-f-]{36}/);
    const savedUrl = page.url();
    logger.info(`>> [Draft] Saved URL: ${savedUrl}`);

    // Reload and verify persistence
    logger.info(">> [Draft] Reloading to verify persistence...");
    await page.goto(savedUrl);

    // Wait for initial load overlay to disappear
    await expect(page.getByText(/opening your draft/i)).toBeHidden();

    // Check recipient
    await expect(page.locator("#recipient")).toHaveValue(recipientName);

    // Check canvas content
    // We wait for the content to appear in the textarea.
    // toHaveValue will poll until it matches or timeouts.
    await canvasInput.focus();
    await expect(canvasInput).toHaveValue(/This is a secret draft/i, {
      timeout: 10000,
    });
    await expect(canvasInput).toHaveValue(/It should persist/i);
  });

  test("should seal a letter and show sharing link", async ({ page }) => {
    const timestamp = Date.now() + Math.random();
    const email = `seal-${timestamp}@example.com`;
    const name = `Seal Author ${timestamp}`;

    await AuthHelper.registerAndLogin(page, email, name, password);

    logger.info(">> [Seal] Navigating to Editor via UI...");
    await page.getByRole("button", { name: /write something/i }).click();

    const recipientInput = page.locator("#recipient");
    await recipientInput.waitFor({ state: "visible", timeout: 20000 });
    await recipientInput.fill("A Secret Guest");

    const canvasInput = page.getByLabel("Canvas text input");
    await canvasInput.focus();
    await canvasInput.fill("This letter will be sealed and shared.");

    // Click Seal
    logger.info(">> [Seal] Clicking Seal...");
    await page.getByRole("button", { name: /seal/i }).click();

    // Verify "Sealed & Ready" modal
    logger.info(">> [Seal] Verifying sharing modal...");
    await expect(page.getByText(/sealed & ready/i)).toBeVisible();

    // Verify sharing link contains a hash (the key)
    const linkInput = page.locator("input[readOnly]");
    const linkValue = await linkInput.inputValue();

    expect(linkValue).toContain("/read/");
    expect(linkValue).toContain("#");

    logger.info(`>> [Seal] Sharing link generated: ${linkValue}`);

    // Verify "Copy" button works
    await expect(page.getByRole("button", { name: /copy/i })).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: /close/i }).click();
    await expect(page.getByText(/sealed & ready/i)).toBeHidden();
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
    await page.getByRole("button", { name: /write something/i }).click();

    const recipientInput = page.locator("#recipient");
    await recipientInput.waitFor({ state: "visible" });
    await recipientInput.fill(recipientName);

    const canvasInput = page.getByLabel("Canvas text input");
    await canvasInput.focus();
    await canvasInput.fill(letterContent);

    // Click Seal
    await page.getByRole("button", { name: /seal/i }).click();
    await expect(page.getByText(/sealed & ready/i)).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: /close/i }).click();

    // Navigate to Drawer - use ID or precise label
    logger.info(">> [Drawer] Navigating to Drawer...");
    await page.locator("button[aria-label='Open Drawer']").click();

    // Open "Kept" section - search for the section with id='kept' and click its toggle button
    logger.info(">> [Drawer] Opening Kept section...");
    const keptSection = page.locator("#kept");
    await keptSection.getByRole("button", { name: /kept/i }).click();

    // Find the sealed letter in the drawer by recipient name and click it
    logger.info(">> [Drawer] Clicking sealed letter in drawer...");
    const sealedItem = page
      .getByRole("button", { name: new RegExp(recipientName, "i") })
      .first();
    await sealedItem.click();

    // Verify it opens the Reader without a hash
    logger.info(">> [Drawer] Verifying Reader page...");
    // Give it a bit more time for decryption
    await expect(page).toHaveURL(/\/read\/[a-f0-9-]{36}$/, { timeout: 15000 }); // UUID without hash

    // Check decrypted content in Reader
    await expect(page.getByText(/decrypting/i)).toBeHidden({
      timeout: 10000,
    });
    await expect(
      page.getByText(new RegExp(`A sealed letter for ${recipientName}`, "i")),
    ).toBeVisible();

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
