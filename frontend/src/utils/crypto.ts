/**
 * 0 knowledge cryptography. No Server involved in encryption/decryption
 */

const ITERATIONS = 100000;
const KEY_ALGO = { name: "AES-GCM", length: 256 };

/**
 * Derives a Master Encryption Key from a password and email (salt).
 */
export async function deriveMasterKey(
  password: string,
  email: string,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(email.toLowerCase()),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    KEY_ALGO,
    false,
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"],
  );
}

/**
 * Encrypts a letter using Envelope Encryption.
 */
export async function encryptLetter(plaintext: string, masterKey: CryptoKey) {
  const encoder = new TextEncoder();

  // Generate random Data Encryption Key (DEK)
  const dek = await crypto.subtle.generateKey(KEY_ALGO, true, [
    "encrypt",
    "decrypt",
  ]);

  // Encrypt the content with the DEK
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    dek,
    encoder.encode(plaintext),
  );

  // encrpyt the DEK using the Master Key for the self access
  const keyIv = crypto.getRandomValues(new Uint8Array(12));
  const wrappedKey = await crypto.subtle.wrapKey("raw", dek, masterKey, {
    name: "AES-GCM",
    iv: keyIv,
  });

  // for recipients (link share), export DEK in raw format
  const rawKey = await crypto.subtle.exportKey("raw", dek);

  // conversion to base64 for transit
  const toBase64 = (buf: Uint8Array) =>
    btoa(buf.reduce((acc, b) => acc + String.fromCharCode(b), ""));

  return {
    // This goes to the server
    encryptedPayload: {
      ciphertext: toBase64(new Uint8Array(ciphertext)),
      iv: toBase64(new Uint8Array(iv)),
      wrappedKey: toBase64(new Uint8Array(wrappedKey)),
      keyIv: toBase64(new Uint8Array(keyIv)),
    },
    // This goes into the url for the recipient
    sharingKey: toBase64(new Uint8Array(rawKey)),
  };
}
