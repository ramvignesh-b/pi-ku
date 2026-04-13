import { beforeEach, describe, expect, it } from "vitest";
import { CryptoUtils } from "./crypto";

let utils: CryptoUtils;

describe("deriveMasterKey", () => {
  beforeEach(async () => {
    utils = new CryptoUtils();
    await utils.initialize();
  });

  it("should generate a valid CryptoKey instance", async () => {
    const key = await CryptoUtils.deriveMasterKey("password", "test@test.com");

    expect(key.type).toBe("secret");
    expect(key).toBeInstanceOf(CryptoKey);
  });

  it("should produce identical keys for identical credentials (deterministic)", async () => {
    const keyA = await CryptoUtils.deriveMasterKey("password", "user@me.com");
    const keyB = await CryptoUtils.deriveMasterKey("password", "USER@me.com");
    const secret = "shared-secret";

    const encryptedContent = await utils.encryptLetter(secret, keyA);
    const decryptedContent = await utils.decryptLetter(encryptedContent, keyB);

    expect(decryptedContent).toBe(secret);
  });

  it("should produce different keys for different users", async () => {
    const keyA = await CryptoUtils.deriveMasterKey(
      "password",
      "test1@gmail.com",
    );
    const keyB = await CryptoUtils.deriveMasterKey(
      "password",
      "test2@gmail.com",
    );

    const encrypted = await utils.encryptLetter("secret", keyA);

    await expect(utils.decryptLetter(encrypted, keyB)).rejects.toThrow();
  });
});

describe("encryptLetter / decryptLetter", () => {
  let masterKey: CryptoKey;

  beforeEach(async () => {
    masterKey = await CryptoUtils.deriveMasterKey("password", "test@test.com");
  });

  it("should restore the original plaintext after a roundtrip", async () => {
    const encrypted = await utils.encryptLetter("secret", masterKey);
    const decrypted = await utils.decryptLetter(encrypted, masterKey);

    expect(decrypted).toBe("secret");
  });

  it("should not contain plaintext in the payload", async () => {
    const secret = "super-secret-text";

    const result = await utils.encryptLetter(secret, masterKey);

    expect(result.encrypted_content).not.toContain(secret);
    expect(result.encrypted_dek).toBeDefined();
  });

  it("should produce different ciphertexts each time for identical plaintexts", async () => {
    const text = "constant-text";

    const enc1 = await utils.encryptLetter(text, masterKey);
    const enc2 = await utils.encryptLetter(text, masterKey);

    expect(enc1.encrypted_content).not.toBe(enc2.encrypted_content);
    expect(enc1.encrypted_dek).not.toBe(enc2.encrypted_dek);
  });
});

describe("encryptMetadata / decryptMetadata", () => {
  let masterKey: CryptoKey;
  beforeEach(async () => {
    masterKey = await CryptoUtils.deriveMasterKey("password", "test@test.com");
  });

  it("should successfully encrypt and decrypt object content", async () => {
    const metadata = {
      title: "title",
      recipient: "self",
      tags: ["tag1", "tag2"],
    };

    const encrypted = await utils.encryptMetadata(metadata, masterKey);
    const decrypted = await utils.decryptMetadata(encrypted, masterKey);

    expect(decrypted).toEqual(metadata);
  });
});

describe("encryptImage / decryptImage", () => {
  let masterKey: CryptoKey;
  beforeEach(async () => {
    masterKey = await CryptoUtils.deriveMasterKey("password", "test@test.com");
  });

  it("should transform a File into an encrypted .bin Blob", async () => {
    const rawData = new TextEncoder().encode("image-data");
    const file = new File([rawData], "photo.jpg", { type: "image/jpeg" });

    const result = await utils.encryptImage(file, masterKey);
    const encryptedText = await result.encryptedBlob.text();

    expect(result.encryptedBlob).toBeInstanceOf(Blob);
    expect(result.encryptedBlob.size).toBeGreaterThan(0);
    expect(result.filename).toMatch(/\.bin$/);
    expect(result.filename).not.toMatch(/photo|jpg/);
    expect(encryptedText).not.toContain("image-data");
  });

  it("should support decryption using a sharing key (guest access)", async () => {
    const rawData = new TextEncoder().encode("image-data");
    const file = new File([rawData], "photo.jpg", { type: "image/jpeg" });

    const result = await utils.encryptImage(file, masterKey);
    const encryptedLetter = await utils.encryptLetter("test", masterKey);
    const sharingKey = encryptedLetter.sharingKey as string;

    const blobUrl = await utils.decryptImageWithSharingKey(
      result.encryptedBlob,
      sharingKey,
    );

    expect(blobUrl).toContain("blob:");
    URL.revokeObjectURL(blobUrl); // cleanup
  });
});

describe("Sharing Key Decryption (TDD)", () => {
  let masterKey: CryptoKey;
  beforeEach(async () => {
    masterKey = await CryptoUtils.deriveMasterKey("pass", "salt");
  });

  it("should decrypt a letter using ONLY the sharing key", async () => {
    const letterContent = "hello, guest";

    const encryptedLetter = await utils.encryptLetter(letterContent, masterKey);
    const sharingKey = encryptedLetter.sharingKey as string;

    const decryptedLetter = await utils.decryptLetterWithSharingKey(
      encryptedLetter.encrypted_content,
      sharingKey,
    );

    expect(decryptedLetter).toBe(letterContent);
  });
});
