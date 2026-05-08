import { useEffect, useMemo, useState } from "react";
import { api } from "../api/apiClient";
import type { LetterMetadata, LetterResponseData } from "../api/response";
import { endpoints } from "../config/endpoints";
import { useKeyStore } from "../store/useKeyStore";
import { CryptoUtils } from "../utils/crypto";

export interface ProcessedLetter extends LetterResponseData {
  metadata: LetterMetadata;
}

async function decryptLettersMetadata(
  letters: LetterResponseData[],
  masterKey: CryptoKey,
): Promise<ProcessedLetter[]> {
  const cryptoUtils = new CryptoUtils();

  return Promise.all(
    letters.map(async (letter) => {
      try {
        const metadata = (await cryptoUtils.decryptMetadata(
          {
            encrypted_content: letter.encrypted_metadata,
            encrypted_dek: letter.encrypted_dek,
          },
          masterKey,
        )) as LetterMetadata;

        return { ...letter, metadata };
      } catch {
        return {
          ...letter,
          metadata: { recipient: "Encrypted Letter" },
        };
      }
    }),
  );
}

export function useLetters() {
  const [letters, setLetters] = useState<ProcessedLetter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthRequired, setIsAuthRequired] = useState<boolean>(false);
  const { masterKey } = useKeyStore();

  // to fetch the letters and decryypt the metadata on load
  useEffect(() => {
    if (!masterKey) {
      setIsAuthRequired(true);
      return;
    }
    setIsAuthRequired(false);
    setError(null);
    setLoading(true);
    api
      .get(endpoints.LETTERS)
      .then((res) => decryptLettersMetadata(res.data, masterKey))
      .then((decrypted) => {
        setLetters(
          decrypted.sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime(),
          ),
        );
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [masterKey]);

  const drawerItems = useMemo(() => {
    return {
      drafts: letters.filter((l) => l.status === "DRAFT"),
      kept: letters.filter((l) => l.type === "KEPT" && l.status === "SEALED"),
      vault: letters.filter((l) => l.type === "VAULT" && l.status === "SEALED"),
      sent: letters.filter((l) => l.type === "SENT" && l.status === "SEALED"),
    };
  }, [letters]);

  if (error) {
    throw error;
  }

  return {
    ...drawerItems,
    loading,
    isAuthRequired,
  };
}
