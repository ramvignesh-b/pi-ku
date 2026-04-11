/**
 * 0 knowledge cryptography. No Server involved in encryption/decryption
 */

export interface EncryptedLetter {
  encrypted_content: string;
  encrypted_dek: string;
  sharingKey: string;
}

export interface EncryptedImageUpload {
  encryptedBlob: Blob;
  encrypted_dek: string;
  sharingKey: string;
}

const PBKDF2_ITERATIONS = 100_000;
const AES_GCM = { name: "AES-GCM", length: 256 } as const;

// base64 conversion for transit
const toBase64 = (buf: Uint8Array): string =>
  btoa(buf.reduce((s, b) => s + String.fromCharCode(b), ""));

// explicit loop ensures Uint8Array<ArrayBuffer> (not ArrayBufferLike)
const fromBase64 = (b64: string): Uint8Array<ArrayBuffer> => {
  const str = atob(b64);
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i);
  return arr;
};

// bundle IV + data into a single base64 string
const packWithIv = (iv: Uint8Array, data: ArrayBuffer): string => {
  const packed = new Uint8Array(iv.length + data.byteLength);
  packed.set(iv);
  packed.set(new Uint8Array(data), iv.length);
  return toBase64(packed);
};

// split IV (first 12 bytes) back out from a packed base64 bundle
const unpackWithIv = (
  b64: string,
): [Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>] => {
  const buf = fromBase64(b64); // ArrayBuffer-backed, so buf.buffer is ArrayBuffer
  return [new Uint8Array(buf.buffer, 0, 12), new Uint8Array(buf.buffer, 12)];
};

/**
 * Derives a Master Key from a password and email (salt).
 * Deterministic — same credentials always produce the same key.
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

/*
 * Wrapper functions
 */
interface SealedEnvelope {
  encryptedContent: string;
  encrypted_dek: string;
  sharingKey: string;
}

async function sealEnvelope(
  input: Uint8Array,
  masterKey: CryptoKey,
): Promise<SealedEnvelope> {
  // copy into a fresh ArrayBuffer — WebCrypto requires ArrayBuffer-backed arrays
  const plainBytes = new Uint8Array(input);

  // 1-time DEK for this payload
  const dek = await crypto.subtle.generateKey(AES_GCM, true, [
    "encrypt",
    "decrypt",
  ]);

  // encrypt the content with the DEK
  const contentIv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: contentIv },
    dek,
    plainBytes,
  );

  // wrap the DEK with the Master Key (for self/owner access)
  const dekIv = crypto.getRandomValues(new Uint8Array(12));
  const wrappedDek = await crypto.subtle.wrapKey("raw", dek, masterKey, {
    name: "AES-GCM",
    iv: dekIv,
  });

  // export raw DEK for the share URL (recipient access, no master key needed)
  const rawDek = await crypto.subtle.exportKey("raw", dek);

  return {
    encryptedContent: packWithIv(contentIv, ciphertext),
    encrypted_dek: packWithIv(dekIv, wrappedDek),
    sharingKey: toBase64(new Uint8Array(rawDek)),
  };
}

async function openEnvelope(
  encryptedContent: string,
  encrypted_dek: string,
  masterKey: CryptoKey,
): Promise<Uint8Array<ArrayBuffer>> {
  // unwrap the DEK using the master key
  const [dekIv, wrappedDek] = unpackWithIv(encrypted_dek);
  const dek = await crypto.subtle.unwrapKey(
    "raw",
    wrappedDek,
    masterKey,
    { name: "AES-GCM", iv: dekIv },
    AES_GCM,
    false,
    ["decrypt"],
  );

  // decrypt the content with the recovered DEK
  const [contentIv, ciphertext] = unpackWithIv(encryptedContent);
  const plainBytes = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: contentIv },
    dek,
    ciphertext,
  );

  return new Uint8Array(plainBytes);
}

/*
 * Letter functions
 */
export async function encryptLetter(
  plaintext: string,
  masterKey: CryptoKey,
): Promise<EncryptedLetter> {
  const { encryptedContent, encrypted_dek, sharingKey } = await sealEnvelope(
    new TextEncoder().encode(plaintext),
    masterKey,
  );

  return { encrypted_content: encryptedContent, encrypted_dek, sharingKey };
}

export async function decryptLetter(
  { encrypted_content, encrypted_dek }: EncryptedLetter,
  masterKey: CryptoKey,
): Promise<string> {
  const plainBytes = await openEnvelope(
    encrypted_content,
    encrypted_dek,
    masterKey,
  );
  return new TextDecoder().decode(plainBytes);
}

/*
 * Metadata functions
 */
export async function encryptMetadata(
  metadata: Record<string, string>,
  masterKey: CryptoKey,
): Promise<EncryptedLetter> {
  const { encryptedContent, encrypted_dek, sharingKey } = await sealEnvelope(
    new TextEncoder().encode(JSON.stringify(metadata)),
    masterKey,
  );

  return { encrypted_content: encryptedContent, encrypted_dek, sharingKey };
}

export async function decryptMetadata(
  encrypted_metadata: EncryptedLetter,
  masterKey: CryptoKey,
): Promise<Record<string, string>> {
  const plainBytes = await openEnvelope(
    encrypted_metadata.encrypted_content,
    encrypted_metadata.encrypted_dek,
    masterKey,
  );
  return JSON.parse(new TextDecoder().decode(plainBytes));
}

/*
 * Image functions
 */
export async function encryptImage(
  file: File,
  masterKey: CryptoKey,
): Promise<EncryptedImageUpload> {
  const plainBytes = new Uint8Array(await file.arrayBuffer());
  const { encryptedContent, encrypted_dek, sharingKey } = await sealEnvelope(
    plainBytes,
    masterKey,
  );

  return {
    encryptedBlob: new Blob([fromBase64(encryptedContent)]),
    encrypted_dek,
    sharingKey,
  };
}

export async function decryptImage(
  encryptedUrl: string,
  encrypted_dek: string,
  masterKey: CryptoKey,
): Promise<string> {
  // fetch encrypted bytes from server and repack as base64 for openEnvelope
  const encryptedBytes = new Uint8Array(
    await (await fetch(encryptedUrl)).arrayBuffer(),
  );
  const plainBytes = await openEnvelope(
    toBase64(encryptedBytes),
    encrypted_dek,
    masterKey,
  );

  // return as object URL for use in Fabric / <img>
  return URL.createObjectURL(new Blob([plainBytes]));
}
