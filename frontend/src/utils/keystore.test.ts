import { afterEach, describe, expect, it } from "vitest";
import { CryptoUtils } from "./crypto";
import { clearMasterKey, loadMasterKey, saveMasterKey } from "./keystore";

afterEach(async () => {
  // clear to avoid in-memory db conflicts when running tests in parallel
  await clearMasterKey();
});

async function makeMasterKey() {
  return CryptoUtils.deriveMasterKey("test-password", "test@example.com");
}

describe("keystore", () => {
  it("should save and load a CryptoKey successfully", async () => {
    const key = await makeMasterKey();

    await saveMasterKey(key);
    const keyfromMemory = await loadMasterKey();

    expect(keyfromMemory).toBeInstanceOf(CryptoKey);
    expect(keyfromMemory).toEqual(key);
  });

  it("should remove the stored key from memory", async () => {
    await saveMasterKey(await makeMasterKey());
    await clearMasterKey();

    const keyfromMemory = await loadMasterKey();

    expect(keyfromMemory).toBeNull();
  });

  async function generateTestKey() {
    // generate a random 'extractable' key for testing
    return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
      "encrypt",
      "decrypt",
    ]);
  }

  it("should overwrite the previous key when calling saveMasterKey twice", async () => {
    const key1 = await generateTestKey();
    const key2 = await generateTestKey();

    await saveMasterKey(key1);
    await saveMasterKey(key2);
    const loadedKey = await loadMasterKey();
    const loadedJwk = await crypto.subtle.exportKey(
      "jwk",
      loadedKey as CryptoKey,
    );
    const key1Jwk = await crypto.subtle.exportKey("jwk", key1);
    const key2Jwk = await crypto.subtle.exportKey("jwk", key2);

    expect(loadedJwk).toStrictEqual(key2Jwk);
    expect(loadedJwk).not.toStrictEqual(key1Jwk);
  });
});
