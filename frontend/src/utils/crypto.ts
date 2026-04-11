/**
 * 0 knowledge cryptography — no server involvement in encryption/decryption.
 */

// IV is the Initialization Vector - random value to randomize the encryption output
// DEK is the Data Encryption Key - random value to encrypt the plaintext
export interface EncryptedLetter {
  encrypted_content: string; // IV + ciphertext, base64
  encrypted_dek: string; // IV + wrapped DEK, base64
  sharingKey: string; // raw DEK, base64 (embedded in share URL)
}

const PBKDF2_ITERATIONS = 100_000;
const AES_GCM = { name: "AES-GCM", length: 256 } as const;

const toBase64 = (buf: Uint8Array): string =>
  btoa(buf.reduce((s, b) => s + String.fromCharCode(b), ""));

// Prefix the IV to data and base64-encode the result.
const packWithIv = (iv: Uint8Array, data: ArrayBuffer): string => {
  const packed = new Uint8Array(iv.length + data.byteLength);
  packed.set(iv);
  packed.set(new Uint8Array(data), iv.length);
  return toBase64(packed);
};

/**
 * Derives a Master Key from the user's password and email (used as PBKDF2 salt).
 * Note: it is deterministic, i.e. the same credentials always produce the same key
 */
export async function deriveMasterKey(
  password: string,
  email: string,
): Promise<CryptoKey> {
  const enc = new TextEncoder();

  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(email.toLowerCase()),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    AES_GCM,
    false,
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"],
  );
}

/**
 * Encrypts a letter using Envelope Encryption.
 *
 *   plaintext >> DEK >> encrypted_content
 *   DEK >> masterKey >> encrypted_dek
 *   DEK >> raw >> sharingKey
 */
export async function encryptLetter(
  plaintext: string,
  masterKey: CryptoKey,
): Promise<EncryptedLetter> {
  const enc = new TextEncoder();

  // 1time DEK for this letter
  const dek = await crypto.subtle.generateKey(AES_GCM, true, [
    "encrypt",
    "decrypt",
  ]);

  // encrypt the plaintext with the DEK
  const contentIv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: contentIv },
    dek,
    enc.encode(plaintext),
  );

  // wrap the DEK with the Master Key (for self access)
  const dekIv = crypto.getRandomValues(new Uint8Array(12));
  const wrappedDek = await crypto.subtle.wrapKey("raw", dek, masterKey, {
    name: "AES-GCM",
    iv: dekIv,
  });

  // export raw DEK for the share URL (recipient access, no master key needed)
  const rawDek = await crypto.subtle.exportKey("raw", dek);

  return {
    encrypted_content: packWithIv(contentIv, ciphertext),
    encrypted_dek: packWithIv(dekIv, wrappedDek),
    sharingKey: toBase64(new Uint8Array(rawDek)),
  };
}
