export interface LetterResponseData {
  public_id: string;
  type: "KEPT" | "SENT" | "VAULT";
  status: "DRAFT" | "SEALED" | "BURNED";
  encrypted_content: string;
  encrypted_metadata: string;
  encrypted_dek: string;
  unlock_at: string | null;
  sealed_at: string | null;
  created_at: string;
  updated_at: string;
  images: LetterImageData[];
}

// Lifecycle and Disposition are independent axes. See CONTEXT.md.
export type Lifecycle = LetterResponseData["status"];
export type Disposition = LetterResponseData["type"];

// What the author asked for. Resolves into one value on each axis.
export type SaveIntent = "DRAFT" | "SEALED" | "VAULT";

export interface ResolvedIntent {
  lifecycle: Lifecycle;
  disposition: Disposition;
}

export interface LetterImageData {
  public_id: string;
  file: string;
  file_name: string;
}

export interface LetterMetadata {
  recipient: string;
  tags?: string[];
}
