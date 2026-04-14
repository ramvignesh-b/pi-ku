import { expect, test } from "@playwright/test";
import { AuthHelper } from "./utils/auth";

test.describe("Authentication Flow (Real Backend)", () => {
  // Use unique email for each run to avoid conflicts in shared DB
  const timestamp = Date.now();
  const email = `testuser-${timestamp}@example.com`;
  const fullName = `Test User ${timestamp}`;
  const password = "Password123!";

  test("should register, activate via email, and login successfully", async ({
    page,
  }) => {
    // Perform full auth cycle using helper
    await AuthHelper.registerAndLogin(page, email, fullName, password);

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
