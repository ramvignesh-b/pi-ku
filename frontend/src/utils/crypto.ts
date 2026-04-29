export interface EncryptedLetter {
  encrypted_content: string;
  encrypted_dek: string;
  sharingKey?: string | null;
}

export interface EncryptedLetterMetadata {
  encrypted_content: string;
  encrypted_dek: string;
  sharingKey?: string | null;
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

// we use a class here to keep track of instantiations (use 1 and the same DEK per letter content and metadata)
// TODO: try refactoring into a pure function for consistency
export class CryptoUtils {
  private dek!: CryptoKey;
  private static readonly PBKDF2_ITERATIONS =
    Number(import.meta.env.VITE_PBKDF2_ITERATIONS) || 600_000;
  // NOTE: https://www.w3.org/TR/webcrypto/#aes-gcm
  private static readonly AES_ALGO = { name: "AES-GCM", length: 256 };
  private static readonly IV_BYTE_LENGTH = 12;

  // NOTE: this MUST be called once, per letter, for all operations in a session to a fresh Data Encryption Key (DEK)
  async initialize() {
    this.dek = await crypto.subtle.generateKey(CryptoUtils.AES_ALGO, true, [
      "encrypt",
      "decrypt",
    ]);
  }

  private toBase64 = (buffer: Uint8Array): string => {
    // convert buffer to raw string
    let binaryFileString = "";
    for (let i = 0; i < buffer.byteLength; i++) {
      binaryFileString += String.fromCharCode(buffer[i]);
    }
    return btoa(binaryFileString);
  };

  private fromBase64 = (b64String: string): Uint8Array<ArrayBuffer> => {
    const decodedString = atob(b64String);
    const arr = new Uint8Array(decodedString.length);
    for (let i = 0; i < decodedString.length; i++)
      arr[i] = decodedString.charCodeAt(i);
    return arr;
  };

  // Required structure: [12 bytes IV][Cipher text][16 bytes Auth Tag]
  // NOTE: Web Crypto API auto appends the auth tag, so we focus on IV and cipher
  private packWithIv = (iv: Uint8Array, ciphertext: ArrayBuffer): string => {
    // create a buffer large enough to hold both iv and cipher text (12 + x bytes)
    const combinedPayload = new Uint8Array(
      CryptoUtils.IV_BYTE_LENGTH + ciphertext.byteLength,
    );

    // place the iv at the start
    combinedPayload.set(iv, 0);

    // place the ciphertext after the iv
    combinedPayload.set(new Uint8Array(ciphertext), CryptoUtils.IV_BYTE_LENGTH);

    // convert the buffer to Base64 for transit
    return this.toBase64(combinedPayload);
  };

  // For decryption: extracts the IV and the data from the base64 string, easy because we know the size of iv already.
  private unpackWithIv = (
    encodedString: string,
  ): { iv: Uint8Array<ArrayBuffer>; ciphertext: Uint8Array<ArrayBuffer> } => {
    // decode from base64 to array buffer
    const fullBuffer = this.fromBase64(encodedString);

    // extract first 12 bytes for iv
    const iv = fullBuffer.slice(0, CryptoUtils.IV_BYTE_LENGTH);
    // extract rest for cipher text
    const ciphertext = fullBuffer.slice(CryptoUtils.IV_BYTE_LENGTH);

    return { iv: new Uint8Array(iv), ciphertext: new Uint8Array(ciphertext) };
  };

  /**
   * Derive a key bundle (Masterkey + authHash) from email + (plain) password combo
   * WHY?: This is much secure than relying on server to hash and store the password. Also ensures absolute 0 knowledge
   */
  public static async deriveKeyBundle(
    password: string,
    email: string,
  ): Promise<{ masterKey: CryptoKey; authHash: string }> {
    const encoder = new TextEncoder();
    const salt = encoder.encode(email.toLowerCase());

    const baseKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
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

    // first 256 bits for masterkey, last 256 bits for authHash (password sent in REST)
    const masterKeyBytes = masterSeed.slice(0, 32);
    const authHashBytes = masterSeed.slice(32, 64);

    // Create the masterkey for client-side encryption
    const masterKey = await crypto.subtle.importKey(
      "raw",
      masterKeyBytes,
      CryptoUtils.AES_ALGO,
      false,
      ["encrypt", "decrypt", "wrapKey", "unwrapKey"],
    );

    // convert bytes in to hex string
    let authHash = "";
    const authHashBuffer = new Uint8Array(authHashBytes);

    for (let i = 0; i < authHashBuffer.byteLength; i++) {
      // we force every bytes converted to string to be min 2 chars (otherwise 00 0a will be just a and not "000a")
      authHash += authHashBuffer[i].toString(16).padStart(2, "0");
    }

    return { masterKey, authHash };
  }

  /*
   * Envelope Encryption - Decryption
   * WHY?: for guest access where we don't have to share the masterkey just the dek.
   * This way, raw dek never leaves browser (db stores the encrypted version)
   */

  // encrypt the plaintext with a DEK and then encrypt (wrap) that DEK with the user's masterkey.
  private async sealEnvelope(
    input: Uint8Array,
    masterKey: CryptoKey,
  ): Promise<SealedEnvelope> {
    if (!this.dek) {
      throw new Error("DEK is not available (forgot to .initialize()?)");
    }
    const plainBytes = new Uint8Array(input);
    const contentIv = crypto.getRandomValues(new Uint8Array(12));
    const dekIv = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
      { name: CryptoUtils.AES_ALGO.name, iv: contentIv },
      this.dek,
      plainBytes,
    );

    // wrap the DEK with the Master Key (for self access)
    const wrappedDek = await crypto.subtle.wrapKey("raw", this.dek, masterKey, {
      name: CryptoUtils.AES_ALGO.name,
      iv: dekIv,
    });

    // export raw DEK for the share URL (recipient access, no master key needed)
    const rawDek = await crypto.subtle.exportKey("raw", this.dek);

    return {
      encryptedContent: this.packWithIv(contentIv, ciphertext),
      encrypted_dek: this.packWithIv(dekIv, wrappedDek),
      sharingKey: this.toBase64(new Uint8Array(rawDek)),
    };
  }

  // Unwrap the DEK with the master key to get the key back. Decrypt the content with the DEK.
  private async openEnvelope(
    encryptedContent: string,
    encrypted_dek: string,
    masterKey: CryptoKey,
  ): Promise<Uint8Array<ArrayBuffer>> {
    const { iv: dekIv, ciphertext: wrappedDek } =
      this.unpackWithIv(encrypted_dek);
    const dek = await crypto.subtle.unwrapKey(
      "raw",
      wrappedDek,
      masterKey,
      { name: CryptoUtils.AES_ALGO.name, iv: dekIv },
      CryptoUtils.AES_ALGO,
      false,
      ["decrypt"],
    );

    const { iv: contentIv, ciphertext } = this.unpackWithIv(encryptedContent);
    const plainBytes = await crypto.subtle.decrypt(
      { name: CryptoUtils.AES_ALGO.name, iv: contentIv },
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
      CryptoUtils.AES_ALGO,
      false,
      ["decrypt"],
    );

    const { iv: contentIv, ciphertext } = this.unpackWithIv(encryptedContent);
    const plainBytes = await crypto.subtle.decrypt(
      { name: CryptoUtils.AES_ALGO.name, iv: contentIv },
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
  ): Promise<EncryptedLetterMetadata> {
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
    const plainBytes = await this.openEnvelope(
      this.toBase64(encryptedBytes),
      encrypted_dek,
      masterKey,
    );

    return URL.createObjectURL(new Blob([plainBytes]));
  }

  public async decryptImageWithSharingKey(
    encryptedBlob: Blob,
    sharingKey: string,
  ): Promise<string> {
    const encryptedBytes = new Uint8Array(await encryptedBlob.arrayBuffer());
    const plainBytes = await this.openEnvelopeWithSharingKey(
      this.toBase64(encryptedBytes),
      sharingKey,
    );

    return URL.createObjectURL(new Blob([plainBytes]));
  }

  // derive raw DEK on demand (browser only, not sent to server) for guest access
  public async extractSharingKey(
    encrypted_dek: string,
    masterKey: CryptoKey,
  ): Promise<string> {
    const { iv: dekIv, ciphertext: wrappedDek } =
      this.unpackWithIv(encrypted_dek);
    const rawDek = await crypto.subtle.unwrapKey(
      "raw",
      wrappedDek,
      masterKey,
      { name: CryptoUtils.AES_ALGO.name, iv: dekIv },
      CryptoUtils.AES_ALGO,
      true,
      ["decrypt"],
    );

    return this.toBase64(
      new Uint8Array(await crypto.subtle.exportKey("raw", rawDek)),
    );
  }
}
