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

export interface LetterImageData {
  public_id: string;
  file: string;
  file_name: string;
}

export interface LetterMetadata {
  recipient: string;
  tags?: string[];
}
