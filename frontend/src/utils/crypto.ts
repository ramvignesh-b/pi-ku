export interface EncryptedLetter {
  encrypted_content: string;
  encrypted_dek: string;
  sharingKey?: string | null;
}

export interface EncryptedLetterMetadata {
  encrypted_content: string;
  encrypted_dek: string;
}

export interface EncryptedImageUpload {
  encryptedBlob: Blob;
  encrypted_dek: string;
  filename: string;
}

interface SealedEnvelope {
  encryptedContent: string;
  encrypted_dek: string;
  sharingKey: string;
}

export class CryptoUtils {
  private dek: CryptoKey = {} as CryptoKey;
  private static readonly PBKDF2_ITERATIONS = 100_000;
  private static readonly AES_GCM = { name: "AES-GCM", length: 256 };

  // Generates a fresh Data Encryption Key (DEK)
  async initialize() {
    this.dek = await crypto.subtle.generateKey(CryptoUtils.AES_GCM, true, [
      "encrypt",
      "decrypt",
    ]);
  }

  // base64 conversion for transit
  toBase64 = (buf: Uint8Array): string =>
    btoa(buf.reduce((s, b) => s + String.fromCharCode(b), ""));

  fromBase64 = (b64: string): Uint8Array<ArrayBuffer> => {
    const str = atob(b64);
    const arr = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i);
    return arr;
  };

  // bundle IV + data into a single base64 string
  packWithIv = (iv: Uint8Array, data: ArrayBuffer): string => {
    const packed = new Uint8Array(iv.length + data.byteLength);
    packed.set(iv);
    packed.set(new Uint8Array(data), iv.length);
    return this.toBase64(packed);
  };

  unpackWithIv = (
    b64: string,
  ): [Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>] => {
    const buf = this.fromBase64(b64);
    return [new Uint8Array(buf.buffer, 0, 12), new Uint8Array(buf.buffer, 12)];
  };

  /**
   * Derives a Key Bundle (MasterKey + AuthHash) from a password + email.
   */
  public static async deriveKeyBundle(
    password: string,
    email: string,
  ): Promise<{ masterKey: CryptoKey; authHash: string }> {
    const enc = new TextEncoder();
    const salt = enc.encode(email.toLowerCase());

    const baseKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"],
    );

    const masterSeed = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: CryptoUtils.PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      baseKey,
      512,
    );

    // first 256 bits for MasterKey, last 256 bits for AuthHash
    const masterKeyBytes = masterSeed.slice(0, 32);
    const authHashBytes = masterSeed.slice(32, 64);

    // Create the MasterKey for client-side encryption
    const masterKey = await crypto.subtle.importKey(
      "raw",
      masterKeyBytes,
      CryptoUtils.AES_GCM,
      false,
      ["encrypt", "decrypt", "wrapKey", "unwrapKey"],
    );

    // Create the hex AuthHash for server-side verification
    const authHash = Array.from(new Uint8Array(authHashBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return { masterKey, authHash };
  }

  private async sealEnvelope(
    input: Uint8Array,
    masterKey: CryptoKey,
  ): Promise<SealedEnvelope> {
    const plainBytes = new Uint8Array(input);
    const contentIV = crypto.getRandomValues(new Uint8Array(12));
    const dekIV = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: contentIV },
      this.dek,
      plainBytes,
    );

    // wrap the DEK with the Master Key (for self/owner access)
    const wrappedDek = await crypto.subtle.wrapKey("raw", this.dek, masterKey, {
      name: "AES-GCM",
      iv: dekIV,
    });

    // export raw DEK for the share URL (recipient access, no master key needed)
    const rawDek = await crypto.subtle.exportKey("raw", this.dek);

    return {
      encryptedContent: this.packWithIv(contentIV, ciphertext),
      encrypted_dek: this.packWithIv(dekIV, wrappedDek),
      sharingKey: this.toBase64(new Uint8Array(rawDek)),
    };
  }

  // Unwrap the DEK with the master key to get the key back. Decrypt the content with the DEK.
  private async openEnvelope(
    encryptedContent: string,
    encrypted_dek: string,
    masterKey: CryptoKey,
  ): Promise<Uint8Array<ArrayBuffer>> {
    const [dekIv, wrappedDek] = this.unpackWithIv(encrypted_dek);
    const dek = await crypto.subtle.unwrapKey(
      "raw",
      wrappedDek,
      masterKey,
      { name: "AES-GCM", iv: dekIv },
      CryptoUtils.AES_GCM,
      false,
      ["decrypt"],
    );

    const [contentIv, ciphertext] = this.unpackWithIv(encryptedContent);
    const plainBytes = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: contentIv },
      dek,
      ciphertext,
    );

    return new Uint8Array(plainBytes);
  }

  private async openEnvelopeWithSharingKey(
    encryptedContent: string,
    sharingKey: string,
  ): Promise<Uint8Array<ArrayBuffer>> {
    const dekBytes = this.fromBase64(sharingKey);
    const dek = await crypto.subtle.importKey(
      "raw",
      dekBytes,
      CryptoUtils.AES_GCM,
      false,
      ["decrypt"],
    );

    const [contentIv, ciphertext] = this.unpackWithIv(encryptedContent);
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
  public async encryptLetter(
    plaintext: string,
    masterKey: CryptoKey,
  ): Promise<EncryptedLetter> {
    const { encryptedContent, encrypted_dek, sharingKey } =
      await this.sealEnvelope(new TextEncoder().encode(plaintext), masterKey);
    return { encrypted_content: encryptedContent, encrypted_dek, sharingKey };
  }

  public async decryptLetter(
    { encrypted_content, encrypted_dek }: EncryptedLetter,
    masterKey: CryptoKey,
  ): Promise<string> {
    const bytes = await this.openEnvelope(
      encrypted_content,
      encrypted_dek,
      masterKey,
    );
    return new TextDecoder().decode(bytes);
  }

  public async decryptLetterWithSharingKey(
    encrypted_content: string,
    sharingKey: string,
  ): Promise<string> {
    const bytes = await this.openEnvelopeWithSharingKey(
      encrypted_content,
      sharingKey,
    );
    return new TextDecoder().decode(bytes);
  }

  public async encryptMetadata(
    metadata: Record<string, any>,
    masterKey: CryptoKey,
  ): Promise<EncryptedLetter> {
    const { encryptedContent, encrypted_dek, sharingKey } =
      await this.sealEnvelope(
        new TextEncoder().encode(JSON.stringify(metadata)),
        masterKey,
      );
    return { encrypted_content: encryptedContent, encrypted_dek, sharingKey };
  }

  public async decryptMetadata(
    encrypted_metadata: EncryptedLetter,
    masterKey: CryptoKey,
  ): Promise<Record<string, any>> {
    const bytes = await this.openEnvelope(
      encrypted_metadata.encrypted_content,
      encrypted_metadata.encrypted_dek,
      masterKey,
    );
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  public async decryptMetadataWithSharingKey(
    encrypted_content: string,
    sharingKey: string,
  ): Promise<Record<string, any>> {
    const bytes = await this.openEnvelopeWithSharingKey(
      encrypted_content,
      sharingKey,
    );
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  public async encryptImage(
    file: File,
    masterKey: CryptoKey,
  ): Promise<EncryptedImageUpload> {
    const plainBytes = new Uint8Array(await file.arrayBuffer());
    const { encryptedContent, encrypted_dek } = await this.sealEnvelope(
      plainBytes,
      masterKey,
    );

    return {
      encryptedBlob: new Blob([this.fromBase64(encryptedContent)]),
      encrypted_dek,
      filename: `${crypto.randomUUID()}.bin`,
    };
  }

  public async decryptImage(
    encryptedBlob: Blob,
    encrypted_dek: string,
    masterKey: CryptoKey,
  ): Promise<string> {
    const encryptedBytes = new Uint8Array(await encryptedBlob.arrayBuffer());
    const bytes = await this.openEnvelope(
      this.toBase64(encryptedBytes),
      encrypted_dek,
      masterKey,
    );
    return URL.createObjectURL(new Blob([bytes]));
  }

  public async decryptImageWithSharingKey(
    encryptedBlob: Blob,
    sharingKey: string,
  ): Promise<string> {
    const encryptedBytes = new Uint8Array(await encryptedBlob.arrayBuffer());
    const bytes = await this.openEnvelopeWithSharingKey(
      this.toBase64(encryptedBytes),
      sharingKey,
    );
    return URL.createObjectURL(new Blob([bytes]));
  }

  //  Re-derives the sharing key (raw DEK) on demand (browser only, not sent to server).
  public async extractSharingKey(
    encrypted_dek: string,
    masterKey: CryptoKey,
  ): Promise<string> {
    const [dekIv, wrappedDek] = this.unpackWithIv(encrypted_dek);
    const rawDek = await crypto.subtle.unwrapKey(
      "raw",
      wrappedDek,
      masterKey,
      { name: "AES-GCM", iv: dekIv },
      CryptoUtils.AES_GCM,
      true,
      ["decrypt"],
    );
    return this.toBase64(
      new Uint8Array(await crypto.subtle.exportKey("raw", rawDek)),
    );
  }
}
