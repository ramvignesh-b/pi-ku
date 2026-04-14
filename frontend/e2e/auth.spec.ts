import { expect, test } from "@playwright/test";
import { MailpitHelper } from "./utils/mailpit";

test.describe("Authentication Flow (Real Backend)", () => {
  // Use unique email for each run to avoid conflicts in shared DB
  const timestamp = Date.now();
  const email = `testuser-${timestamp}@example.com`;
  const fullName = `Test User ${timestamp}`;
  const password = "Password123!";

  test("should register, activate via email, and login successfully", async ({
    page,
  }) => {
    // 1. Registration
    console.log(">>--- Navigating to Onboard Page...");
    await page.goto("/onboard");

    // Fill the registration form
    await page.getByLabel(/full name/i).fill(fullName);
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel(/confirm password/i).fill(password);

    // Submit Registration
    await page.getByRole("button", { name: /^register$/i }).click();

    // Verify redirect to check-email page
    console.log(">>--- Verifying redirect to check-email...");
    await expect(page).toHaveURL(/\/verify-email/);
    await expect(page.getByText(/check your email/i)).toBeVisible();

    // 2. Activation via Mailpit
    console.log(`>>--- Polling Mailpit for activation email for ${email}...`);
    const activationLink = await MailpitHelper.getActivationLink(email);
    console.log(`>>--- Found activation link: ${activationLink}`);

    // Navigate to the activation link (this should activate and redirect to login)
    await page.goto(activationLink);

    // Verify activation success
    console.log(">>--- Verifying activation success...");
    await expect(page.getByText(/account activated/i)).toBeVisible();

    // Click "Start Writing" to go to Login
    await page.getByRole("button", { name: /start writing/i }).click();

    // Verify redirect to login
    console.log(">>--- Verifying redirect to login...");
    await expect(page).toHaveURL(/\/login/);

    // 3. Login
    console.log(">>--- Navigated to Login. Handling Welcome Modal...");
    const welcomeButton = page.getByRole("button", { name: /i understand/i });
    await welcomeButton.waitFor({ state: "visible", timeout: 10000 });
    await welcomeButton.click();
    await expect(welcomeButton).toBeHidden();

    console.log(">>--- Performing Login...");
    const loginButton = page.getByRole("button", { name: /sign in/i });
    await expect(loginButton).toBeVisible();

    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await loginButton.click();

    // 4. Verify Success - Redirect to Drawer
    console.log(">>--- Verifying redirect to Drawer...");
    await expect(page).toHaveURL(/\/drawer/);

    // 5. Verify Zero-Knowledge Artifacts in IndexedDB
    console.log(">>--- Verifying MasterKey in IndexedDB...");
    const masterKeyExists = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open("piku-keys");
        request.onsuccess = (event: any) => {
          const db = event.target.result;
          try {
            const transaction = db.transaction(["master-key"], "readonly");
            const store = transaction.objectStore("master-key");
            const getReq = store.get("masterKey");
            getReq.onsuccess = () => resolve(!!getReq.result);
            getReq.onerror = () => resolve(false);
          } catch (_e) {
            resolve(false);
          }
        };
        request.onerror = () => resolve(false);
      });
    });

    expect(masterKeyExists).toBe(true);
    console.log(">>--- E2E Flow Completed Successfully! ✅ ---<<");
  });
});
