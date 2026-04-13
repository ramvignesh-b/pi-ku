import { CrossIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { api } from "../api/apiClient";
import {
  type CanvasTools,
  ComposeCanvas,
} from "../components/ui/ComposeCanvas";
import { endpoints } from "../config/endpoints";
import { CryptoUtils } from "../utils/crypto";
import { decryptCanvasImagesWithSharingKey } from "../utils/letterLogic";

export default function Reader() {
  const { public_id } = useParams();
  const location = useLocation();
  const sharingKey = location.hash.replace("#", "");

  const canvasRef = useRef<CanvasTools>(null);

  const [isDecrypting, setIsDecrypting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [decryptedCanvasData, setDecryptedCanvasData] = useState<any>(null);

  useEffect(() => {
    if (!sharingKey) {
      setError("No sharing key provided. Please check the link.");
      setIsDecrypting(false);
      return;
    }

    const loadAndDecrypt = async () => {
      try {
        const response = await api.get(`${endpoints.LETTERS}${public_id}/`);
        const { encrypted_content, encrypted_metadata, images } = response.data;

        const cryptoUtils = new CryptoUtils();

        const decryptedMetadata =
          await cryptoUtils.decryptMetadataWithSharingKey(
            encrypted_metadata,
            sharingKey,
          );
        setMetadata(decryptedMetadata);

        const decryptedContent = await cryptoUtils.decryptLetterWithSharingKey(
          encrypted_content,
          sharingKey,
        );
        const json = JSON.parse(decryptedContent);

        if (images && images.length > 0) {
          await decryptCanvasImagesWithSharingKey(
            json,
            images,
            sharingKey,
            cryptoUtils,
          );
        }

        setDecryptedCanvasData(json);
      } catch (err: any) {
        setError(`Failed to load letter: ${err.message || "Unknown error"}`);
      } finally {
        setIsDecrypting(false);
      }
    };

    loadAndDecrypt();
  }, [public_id, sharingKey]);

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
