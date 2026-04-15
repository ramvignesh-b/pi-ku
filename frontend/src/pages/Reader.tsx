import { CrossIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { api } from "../api/apiClient";
import {
  type CanvasJSON,
  type CanvasTools,
  ComposeCanvas,
} from "../components/ui/ComposeCanvas";
import { endpoints } from "../config/endpoints";
import { useKeyStore } from "../store/useKeyStore";
import { CryptoUtils } from "../utils/crypto";
import {
  decryptCanvasImages,
  decryptCanvasImagesWithSharingKey,
} from "../utils/letterLogic";

interface LetterMetadata {
  recipient?: string;
}

export default function Reader() {
  const { public_id } = useParams();
  const location = useLocation();
  const sharingKey = location.hash.replace("#", "");

  const canvasRef = useRef<CanvasTools>(null);

  const [isDecrypting, setIsDecrypting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<{
    message: string;
    log: string;
  } | null>(null);
  const [metadata, setMetadata] = useState<LetterMetadata | null>(null);
  const [decryptedCanvasData, setDecryptedCanvasData] =
    useState<CanvasJSON | null>(null);

  const { masterKey } = useKeyStore();

  useEffect(() => {
    if (!(sharingKey || masterKey)) {
      setError(
        "No sharing key provided. Please check the link or log in if you are the author.",
      );
      setIsDecrypting(false);
      return;
    }

    const loadAndDecrypt = async () => {
      try {
        const response = await api.get(`${endpoints.LETTERS}${public_id}/`);
        const { encrypted_content, encrypted_metadata, encrypted_dek, images } =
          response.data;

        const cryptoUtils = new CryptoUtils();
        const isShared = !!sharingKey;

        if (isShared && !encrypted_content) throw new Error("Content missing");
        const isDecryptionKeyAvailable = encrypted_dek && masterKey;
        if (!(isShared || isDecryptionKeyAvailable))
          throw new Error("Auth required");

        // Decrypt Metadata
        const decryptedMetadata = isShared
          ? await cryptoUtils.decryptMetadataWithSharingKey(
              encrypted_metadata,
              sharingKey,
            )
          : await cryptoUtils.decryptMetadata(
              { encrypted_content: encrypted_metadata, encrypted_dek },
              masterKey,
            );
        setMetadata(decryptedMetadata as LetterMetadata);

        // Decrypt Content
        const decryptedContent = isShared
          ? await cryptoUtils.decryptLetterWithSharingKey(
              encrypted_content,
              sharingKey,
            )
          : await cryptoUtils.decryptLetter(
              { encrypted_content, encrypted_dek },
              masterKey,
            );

        const canvasData: CanvasJSON = JSON.parse(decryptedContent);

        try {
          // Decrypt Images
          if (images?.length > 0) {
            isShared
              ? await decryptCanvasImagesWithSharingKey(
                  canvasData,
                  images,
                  sharingKey,
                  cryptoUtils,
                )
              : await decryptCanvasImages(
                  canvasData,
                  images,
                  encrypted_dek,
                  masterKey,
                  cryptoUtils,
                );
          }
        } catch (err) {
          setWarning({
            message:
              "Failed to decrypt elements. Images might not render in the letter as intended.",
            log: err,
          });
        }

        setDecryptedCanvasData(canvasData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(`Failed to load letter: ${message}`);
      } finally {
        setIsDecrypting(false);
      }
    };

    loadAndDecrypt();
  }, [public_id, sharingKey, masterKey]);

  useEffect(() => {
    if (!isDecrypting && decryptedCanvasData && canvasRef.current) {
      canvasRef.current.loadData(decryptedCanvasData);
    }
  }, [isDecrypting, decryptedCanvasData]);

  if (isDecrypting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center space-y-4">
          <p className="text-base-content/60">Decrypting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 px-6">
        <div className="max-w-md w-full bg-base-100 shadow-xl rounded-2xl p-8 text-center space-y-4">
          <p className="text-error font-medium">{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => (window.location.href = "/")}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen w-full bg-base-200 px-4 py-8">
      {warning && (
        <div className="alert alert-warning">
          <div className="flex-1">
            <p>{warning.message}</p>
            <p className="text-xs opacity-70">{warning.log}</p>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            {metadata?.recipient && (
              <p className="text-base-content/60">
                A sealed message for{" "}
                <span className="font-semibold">
                  {metadata.recipient || "Anonymous"}
                </span>
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => (window.location.href = "/")}
          >
            <CrossIcon size={18} />
          </button>
        </div>

        <div className="bg-paper rounded-sm shadow-primary-content overflow-hidden">
          <ComposeCanvas ref={canvasRef} readOnly />
        </div>
      </div>
    </section>
  );
}
