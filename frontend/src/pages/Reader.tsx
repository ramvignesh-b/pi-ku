import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { api } from "../api/apiClient";
import Logo from "../components/Logo";
import {
  type CanvasJSON,
  type CanvasTools,
  ComposeCanvas,
} from "../components/ui/ComposeCanvas";
import { LogModal } from "../components/ui/LogModal";
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
              // biome-ignore lint/style/noNonNullAssertion: masterKey is guaranteed to be non-null here as isDecryptionKeyAvailable is true
              masterKey!,
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
              // biome-ignore lint/style/noNonNullAssertion: masterKey is guaranteed to be non-null here as isDecryptionKeyAvailable is true
              masterKey!,
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
                  // biome-ignore lint/style/noNonNullAssertion: masterKey is guaranteed to be non-null here as isDecryptionKeyAvailable is true
                  masterKey!,
                  cryptoUtils,
                );
          }
        } catch (err) {
          setWarning({
            message:
              "Failed to decrypt elements. Images might not render in the letter as intended.",
            log: err instanceof Error ? err.message : "Unknown error",
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
      <div className="min-h-screen flex items-center justify-center bg-base-100 font-serif">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none z-0" />
        <div className="text-center space-y-6 z-10">
          <Logo />
          <div className="flex flex-col items-center gap-2">
            <span className="loading loading-ring loading-md text-primary/40"></span>
            <p className="text-[10px] uppercase tracking-[0.4em] text-base-content/20 animate-pulse">
              Breaking the seal...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100 px-6 font-serif">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none z-0" />
        <div className="max-w-md w-full glass-card p-12 text-center space-y-6 z-10 animate-in fade-in zoom-in-95 duration-700">
          <div className="space-y-2">
            <h2 className="text-error font-display text-xl">
              Something went wrong
            </h2>
            <p className="text-base-content/60 text-sm leading-relaxed">
              {error}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm text-xs uppercase tracking-widest hover:text-primary transition-colors"
            onClick={() => (window.location.href = "/")}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen w-full bg-base-100 px-4 py-8 md:py-16 font-serif relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)] pointer-events-none z-0" />

      <LogModal
        isOpen={!!warning}
        onClose={() => setWarning(null)}
        message={warning?.message || ""}
        log={warning?.log || ""}
        status="WARN"
      />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Floating Header */}
        <div className="glass-card px-6 py-4 flex items-center justify-between animate-in fade-in slide-in-from-top-6 duration-1000">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="h-4 w-px bg-base-content/10 hidden sm:block" />
            {metadata?.recipient && (
              <p className="text-[11px] uppercase tracking-[0.2em] text-base-content/40 hidden sm:block">
                A sealed letter for{" "}
                <span className="text-base-content/60 font-semibold">
                  {metadata.recipient}
                </span>
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-circle btn-sm hover:rotate-90 transition-transform duration-500"
            onClick={() => (window.location.href = "/")}
            aria-label="Close"
          ></button>
        </div>

        {/* The Letter */}
        <div className="relative group perspective-1000">
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-75 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

          <div className="bg-paper shadow-warm rounded-sm overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-backwards rotate-[-0.3deg] hover:rotate-0 transition-transform">
            <div className="p-1 md:p-2 bg-base-content/5 opacity-10 pointer-events-none absolute inset-0 z-10" />
            <ComposeCanvas ref={canvasRef} readOnly />
          </div>

          {metadata?.recipient && (
            <p className="text-center sm:hidden text-[10px] uppercase tracking-[0.3em] text-base-content/20 mt-8">
              For {metadata.recipient}
            </p>
          )}
        </div>
      </div>

      {/* Atmospheric Footer */}
      <footer className="mt-16 text-center z-10 opacity-10 pointer-events-none">
        <p className="text-[9px] uppercase tracking-[0.5em]">
          Read. Remember. Release.
        </p>
      </footer>
    </section>
  );
}
