import { expect, test } from "@playwright/test";
import { AuthHelper } from "./utils/auth";

test.describe("Letter Drafting (Real Backend)", () => {
  const password = "Password123!";

  test("should create, store as draft, and persist data", async ({ page }) => {
    const timestamp = Date.now() + Math.random();
    const email = `draft-${timestamp}@example.com`;
    const name = `Draft Author ${timestamp}`;

    await AuthHelper.registerAndLogin(page, email, name, password);

    console.log(">> [Draft] Navigating to Editor via UI...");
    await page.getByRole("button", { name: /write something/i }).click();

    console.log(`>> [Draft] Current URL after click: ${page.url()}`);

    // Wait for the recipient input to be present in the DOM
    const recipientInput = page.locator("#recipient");
    await recipientInput.waitFor({ state: "visible", timeout: 20000 });

    const recipientName = "Dear Friend";
    await recipientInput.fill(recipientName);

    // Type into the Fabric.js canvas
    console.log(">> [Draft] Typing into canvas...");
    const canvasInput = page.getByLabel("Canvas text input");
    await canvasInput.waitFor({ state: "visible" });
    await canvasInput.focus();
    await canvasInput.fill("This is a secret draft created by E2E testing.");

    // Store as draft
    console.log(">> [Draft] Clicking Store...");
    await page.getByRole("button", { name: /store/i }).click();

    // Verify Success Modal/Alert
    await expect(page.getByText(/your letter is saved/i)).toBeVisible();

    // Verify URL updated with a UUID
    await expect(page).toHaveURL(/\/quill\/[0-9a-f-]{36}/);
    const savedUrl = page.url();
    console.log(`>> [Draft] Saved URL: ${savedUrl}`);

    // Reload and verify persistence
    console.log(">> [Draft] Reloading to verify persistence...");
    await page.goto(savedUrl);

    // Wait for initial load overlay to disappear
    await expect(page.getByText(/opening your draft/i)).toBeHidden();

    // Check recipient
    await expect(page.locator("#recipient")).toHaveValue(recipientName);

    // Check canvas content
    await expect(canvasInput).toHaveValue(/This is a secret draft/);
  });

  test("should seal a letter and show sharing link", async ({ page }) => {
    const timestamp = Date.now() + Math.random();
    const email = `seal-${timestamp}@example.com`;
    const name = `Seal Author ${timestamp}`;

    await AuthHelper.registerAndLogin(page, email, name, password);

    console.log(">> [Seal] Navigating to Editor via UI...");
    await page.getByRole("button", { name: /write something/i }).click();

    const recipientInput = page.locator("#recipient");
    await recipientInput.waitFor({ state: "visible", timeout: 20000 });
    await recipientInput.fill("A Secret Guest");

    const canvasInput = page.getByLabel("Canvas text input");
    await canvasInput.focus();
    await canvasInput.fill("This letter will be sealed and shared.");

    // Click Seal
    console.log(">> [Seal] Clicking Seal...");
    await page.getByRole("button", { name: /seal/i }).click();

    // Verify "Sealed & Ready" modal
    console.log(">> [Seal] Verifying sharing modal...");
    await expect(page.getByText(/sealed & ready/i)).toBeVisible();

    // Verify sharing link contains a hash (the key)
    const linkInput = page.locator("input[readOnly]");
    const linkValue = await linkInput.inputValue();

    expect(linkValue).toContain("/read/");
    expect(linkValue).toContain("#");

    console.log(`>> [Seal] Sharing link generated: ${linkValue}`);

    // Verify "Copy" button works
    await expect(page.getByRole("button", { name: /copy/i })).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: /close/i }).click();
    await expect(page.getByText(/sealed & ready/i)).toBeHidden();
  });
});
