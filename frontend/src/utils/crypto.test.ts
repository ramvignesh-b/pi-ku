import { beforeEach, describe, expect, it } from "vitest";
import { CryptoUtils } from "./crypto";

let utils: CryptoUtils;

describe("deriveKeyBundle", () => {
  beforeEach(async () => {
    utils = new CryptoUtils();
    await utils.initialize();
  });

  it("should generate a valid CryptoKey and a 64-char hex authHash", async () => {
    const { masterKey, authHash } = await CryptoUtils.deriveKeyBundle(
      "password",
      "test@test.com",
    );

    expect(masterKey.type).toBe("secret");
    expect(masterKey).toBeInstanceOf(CryptoKey);
    expect(authHash).toHaveLength(64); // SHA-256 hex
    expect(typeof authHash).toBe("string");
  });

  it("should produce identical bundles for identical credentials (deterministic)", async () => {
    const bundleA = await CryptoUtils.deriveKeyBundle(
      "password",
      "user@me.com",
    );
    const bundleB = await CryptoUtils.deriveKeyBundle(
      "password",
      "user@me.com",
    );

    expect(bundleA.authHash).toBe(bundleB.authHash);

    const secret = "shared-secret";
    const encryptedContent = await utils.encryptLetter(
      secret,
      bundleA.masterKey,
    );
    const decryptedContent = await utils.decryptLetter(
      encryptedContent,
      bundleB.masterKey,
    );

    expect(decryptedContent).toBe(secret);
  });

  it("should produce different keys and hashes for different users", async () => {
    const bundleA = await CryptoUtils.deriveKeyBundle(
      "password",
      "test1@gmail.com",
    );
    const bundleB = await CryptoUtils.deriveKeyBundle(
      "password",
      "test2@gmail.com",
    );

    expect(bundleA.authHash).not.toBe(bundleB.authHash);

    const encrypted = await utils.encryptLetter("secret", bundleA.masterKey);
    await expect(
      utils.decryptLetter(encrypted, bundleB.masterKey),
    ).rejects.toThrow();
  });
});

describe("encryptLetter / decryptLetter", () => {
  let masterKey: CryptoKey;

  beforeEach(async () => {
    const bundle = await CryptoUtils.deriveKeyBundle(
      "password",
      "test@test.com",
    );
    masterKey = bundle.masterKey;
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
    const bundle = await CryptoUtils.deriveKeyBundle(
      "password",
      "test@test.com",
    );
    masterKey = bundle.masterKey;
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
    const bundle = await CryptoUtils.deriveKeyBundle(
      "password",
      "test@test.com",
    );
    masterKey = bundle.masterKey;
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
    const bundle = await CryptoUtils.deriveKeyBundle("password", "salt");
    masterKey = bundle.masterKey;
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
