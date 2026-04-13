import { CrossIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { api } from "../api/apiClient";
import { ComposeCanvas } from "../components/ui/ComposeCanvas";
import { endpoints } from "../config/endpoints";
import { CryptoUtils } from "../utils/crypto";
import { decryptCanvasImagesWithSharingKey } from "../utils/letterLogic";

export default function Reader() {
  const { public_id } = useParams();
  const location = useLocation();
  const sharingKey = location.hash.replace("#", "");
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canvasData, setCanvasData] = useState<any>(null);
  const [metadata, setMetadata] = useState<any>(null);

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

        const crypto = new CryptoUtils();

        // 1. Decrypt metadata using the sharing key from the URL
        const decryptedMetadata = await crypto.decryptMetadataWithSharingKey(
          encrypted_metadata,
          sharingKey,
        );
        setMetadata(decryptedMetadata);

        // 2. Decrypt the main letter content
        const decryptedContent = await crypto.decryptLetterWithSharingKey(
          encrypted_content,
          sharingKey,
        );
        const json = JSON.parse(decryptedContent);

        // 3. Batch decrypt any images on the canvas
        if (images && images.length > 0) {
          await decryptCanvasImagesWithSharingKey(json, images, sharingKey);
        }

        setCanvasData(json);
        setIsDecrypting(false);
      } catch (err: any) {
        console.error("Reader Error:", err);
        setError(`Failed to load letter: ${err.message || "Unknown error"}`);
        setIsDecrypting(false);
      }
    };

    loadAndDecrypt();
  }, [public_id, sharingKey]);

  if (isDecrypting) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-8">
        <span className="loading loading-ring loading-lg text-primary"></span>
        <p className="mt-4 text-sm opacity-50 font-medium">Decrypting...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-8 text-center">
        <div className="alert alert-error max-w-md shadow-lg">
          <CrossIcon size={24} />
          <span>{error}</span>
        </div>
        <button
          type="button"
          className="btn btn-ghost mt-6"
          onClick={() => (window.location.href = "/")}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-base-200 flex flex-col items-center justify-center p-8 gap-4 overflow-hidden">
      {metadata?.recipient && (
        <div className="mb-6 animate-in fade-in slide-in-from-top duration-1000">
          <h2 className="text-xl font-serif text-base-content/60 italic">
            A sealed message for {metadata.recipient}
          </h2>
        </div>
      )}
      {canvasData && <ComposeCanvas initialData={canvasData} readOnly={true} />}
    </div>
  );
}
