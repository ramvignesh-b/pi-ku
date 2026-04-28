import { FlameIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import {
  type NavigateFunction,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { api } from "../api/apiClient";
import {
  type CanvasJSON,
  type CanvasTools,
  ComposeCanvas,
} from "../components/editor/ComposeCanvas";
import Logo from "../components/Logo";
import { BurnModal } from "../components/reader/BurnModal";
import { EnvelopeReveal } from "../components/reader/EnvelopeReveal";
import { PostActionOverlay } from "../components/reader/PostActionOverlay";
import { ShareModal } from "../components/reader/ShareModal";
import { LogModal } from "../components/ui/LogModal";
import { endpoints } from "../config/endpoints";
import { PATHS } from "../config/routes";
import { useKeyStore } from "../store/useKeyStore";
import { CryptoUtils } from "../utils/crypto";
import { formatDate } from "../utils/dateFormat";
import {
  decryptCanvasImages,
  decryptCanvasImagesWithSharingKey,
} from "../utils/letterLogic";

interface LetterMetadata {
  recipient?: string;
  updated_at?: string;
}

export default function Reader() {
  const { public_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const sharingKey = location.hash.replace("#", "");

  const navigateRef = useRef<NavigateFunction>(navigate);
  const canvasRef = useRef<CanvasTools>(null);

  const [isDecrypting, setIsDecrypting] = useState(true);
  const [revealState, setRevealState] = useState<
    "sealed" | "revealed" | "burned" | "burning"
  >("sealed");
  const [error, setError] = useState<{
    message: string;
    log: string;
  } | null>(null);
  const [warning, setWarning] = useState<{
    message: string;
    log: string;
  } | null>(null);
  const [metadata, setMetadata] = useState<LetterMetadata | null>(null);
  const [decryptedCanvasData, setDecryptedCanvasData] =
    useState<CanvasJSON | null>(null);
  const [showBurnModal, setShowBurnModal] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [ignite, setIgnite] = useState(false);
  const [encryptedDek, setEncryptedDek] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const { masterKey } = useKeyStore();

  const isAuthor = !!masterKey && !sharingKey;

  const handleShare = async () => {
    if (!(encryptedDek && masterKey && public_id)) return;
    const cryptoUtils = new CryptoUtils();
    const key = await cryptoUtils.extractSharingKey(encryptedDek, masterKey);
    try {
      await api.patch(`${endpoints.LETTERS}${public_id}/`, { type: "SENT" });
    } catch (_err) {
    } finally {
      setShareLink(`${window.location.origin}${PATHS.read(public_id)}#${key}`);
    }
  };

  const burnLetter = async () => {
    if (!public_id || isBurning) return;
    setIsBurning(true);
    try {
      await api.patch(`${endpoints.LETTERS}${public_id}/`, {
        status: "BURNED",
      });
    } catch (_err) {
    } finally {
      setIsBurning(false);
      setShowBurnModal(false);
      setIgnite(true);
      setTimeout(() => {
        setRevealState("burned");
      }, 13000);
    }
  };

  useEffect(() => {
    if (!(sharingKey || masterKey)) {
      navigateRef.current("/login", {
        state: { redirectUrl: `/read/${public_id}` },
      });
      return;
    }

    const loadAndDecrypt = async () => {
      try {
        const response = await api.get(`${endpoints.LETTERS}${public_id}/`);
        const {
          encrypted_content,
          encrypted_metadata,
          encrypted_dek,
          images,
          updated_at,
          status,
        } = response.data;

        if (status === "BURNED")
          throw new Error("This letter has been burned.");

        if (encrypted_dek) setEncryptedDek(encrypted_dek);

        const cryptoUtils = new CryptoUtils();
        const isShared = !!sharingKey;

        if (isShared && !encrypted_content) throw new Error("Content missing");
        const isDecryptionKeyAvailable = encrypted_dek && masterKey;
        if (!(isShared || isDecryptionKeyAvailable))
          throw new Error("Auth required: Decryption key is not available");

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
        setMetadata({
          ...(decryptedMetadata as LetterMetadata),
          updated_at,
        });

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
        setError({
          message: `Failed to load letter :(`,
          log: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setIsDecrypting(false);
      }
    };

    loadAndDecrypt();
  }, [public_id, sharingKey, masterKey]);

  useEffect(() => {
    if (
      !isDecrypting &&
      revealState === "revealed" &&
      decryptedCanvasData &&
      canvasRef.current
    ) {
      canvasRef.current.loadData(decryptedCanvasData);
    }
  }, [isDecrypting, revealState, decryptedCanvasData]);

  if (isDecrypting) {
    return (
      <div className="flex items-center justify-center bg-base-100 font-serif">
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
      <LogModal
        isOpen={!!error}
        onClose={() => (window.location.href = "/")}
        message={error.message}
        log={error.log}
        status="ERROR"
      />
    );
  }

  return (
    <section className="min-h-fit w-full bg-base-100 px-4 py-8 md:py-16 font-serif relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)] pointer-events-none z-0" />
      <div
        className={`transition-all delay-300 duration-1000 relative ${
          revealState === "revealed"
            ? "opacity-0 w-0 h-0 overflow-hidden invisible"
            : "opacity-100"
        }`}
      >
        {revealState === "sealed" && (
          <div className="h-[80vh] mx-auto flex-col items-center flex justify-center">
            <div className="perspective-distant scale-80 duration-1000 transition-all animate-[pulse_2s_linear_1]">
              <EnvelopeReveal
                recipient={metadata?.recipient || "Someone dear"}
                date={
                  metadata?.updated_at
                    ? formatDate(new Date(metadata.updated_at))
                    : undefined
                }
                onRevealComplete={() => setRevealState("revealed")}
                ignite={ignite}
              />
            </div>
          </div>
        )}
      </div>

      {ignite && <PostActionOverlay revealState={revealState} />}

      <LogModal
        isOpen={!!warning}
        onClose={() => setWarning(null)}
        message={warning?.message || ""}
        log={warning?.log || ""}
        status="WARN"
      />

      {revealState === "revealed" && (
        <div className="max-w-4xl m-8 mx-auto space-y-8 h-full relative inset-0 z-100">
          <div className="relative group perspective-1000">
            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-75 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

            <div className="bg-paper shadow-warm rounded-sm overflow-hidden animate-[opacity_1s_ease-in-out_1]">
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
      )}

      {shareLink && (
        <ShareModal shareLink={shareLink} setShareLink={setShareLink} />
      )}
      {showBurnModal && (
        <BurnModal
          burnLetter={burnLetter}
          isBurning={isBurning}
          setShowBurnModal={setShowBurnModal}
          setRevealState={setRevealState}
        />
      )}

      {isAuthor && revealState !== "burned" && (
        <div className="flex justify-center gap-2 mt-8 z-10 relative">
          <button
            id="share-letter-btn"
            type="button"
            className="btn btn-ghost btn-sm text-base-content/30 hover:text-base-content hover:bg-base-content/10 gap-1.5"
            onClick={handleShare}
          >
            <PaperPlaneTiltIcon size={16} weight="duotone" />
            <span className="text-md uppercase font-sans tracking-widest">
              Send to someone
            </span>
          </button>
          <button
            id="burn-letter-btn"
            type="button"
            className="btn btn-ghost btn-sm text-error/40 hover:text-error hover:bg-error/10 gap-1.5"
            onClick={() => setShowBurnModal(true)}
          >
            <FlameIcon size={16} weight="duotone" />
            <span className="text-md uppercase font-sans tracking-widest">
              Burn the letter
            </span>
          </button>
        </div>
      )}

      <footer className="mt-16 text-center z-10 opacity-10 pointer-events-none">
        <p className="text-xs font-sans uppercase tracking-[0.5em]">
          Read. Remember. Release.
        </p>
      </footer>
    </section>
  );
}
