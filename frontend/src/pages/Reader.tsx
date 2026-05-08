import { FlameIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import type { AxiosResponse } from "axios";
import { useEffect, useRef, useState } from "react";
import {
  type NavigateFunction,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { api } from "../api/apiClient";
import type { LetterImageData, LetterResponseData } from "../api/response";
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

const WAIT_FOR_BURN_MS = 18000;
export default function Reader() {
  const { public_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const sharingKey = location.hash.replace("#", "");

  const navigateRef = useRef<NavigateFunction>(navigate);
  const canvasRef = useRef<CanvasTools>(null);

  const [isDecrypting, setIsDecrypting] = useState(true);
  const [revealState, setRevealState] = useState<
    "SEALED" | "REVEALED" | "BURNED" | "BURNING"
  >("SEALED");
  const [logTrace, setLogTrace] = useState<{
    type: "WARN" | "ERROR";
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
    } catch {
      // shouldn't obstruct share if api operation fails (since it's client side share)
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
    } catch {
      // should not obstruct burn if api operation fails
      // WHY?: it disconnects the UX. if you want to burn the letter, you should be able to burn the letter
      // TODO: maybe say something like: "the wind is strong today, let's try again"? or maybe something less stupid :3
    } finally {
      setIsBurning(false);
      setShowBurnModal(false);
      setIgnite(true);
      setTimeout(() => {
        setRevealState("BURNED");
      }, WAIT_FOR_BURN_MS);
    }
  };

  useEffect(() => {
    if (!(sharingKey || masterKey)) {
      navigateRef.current("/login", {
        state: { redirectUrl: `/read/${public_id}` },
      });
      return;
    }

    const decryptImages = async (
      canvasData: CanvasJSON,
      images: LetterImageData[],
      encrypted_dek: string,
      cryptoUtils: CryptoUtils,
    ) => {
      if (!images?.length) return;
      const isShared = !!sharingKey;
      try {
        if (isShared) {
          await decryptCanvasImagesWithSharingKey(
            canvasData,
            images,
            sharingKey,
            cryptoUtils,
          );
        } else {
          await decryptCanvasImages(
            canvasData,
            images,
            encrypted_dek,
            // biome-ignore lint/style/noNonNullAssertion: masterKey is guaranteed to be non-null here as isDecryptionKeyAvailable is true
            masterKey!,
            cryptoUtils,
          );
        }
      } catch (err) {
        setLogTrace({
          message:
            "Failed to decrypt elements. Images might not render in the letter as intended.",
          log: err instanceof Error ? err.message : "Unknown error",
          type: "WARN",
        });
      }
    };

    const decryptLetterData = async (
      data: LetterResponseData,
      cryptoUtils: CryptoUtils,
    ) => {
      const isShared = !!sharingKey;
      const {
        encrypted_content,
        encrypted_metadata,
        encrypted_dek,
        images,
        updated_at,
      } = data;

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
      await decryptImages(canvasData, images, encrypted_dek, cryptoUtils);
      setDecryptedCanvasData(canvasData);
    };

    const processLetterData = async (data: LetterResponseData) => {
      if (data.status === "BURNED")
        throw new Error("This letter has been burned.");

      if (data.encrypted_dek) setEncryptedDek(data.encrypted_dek);

      const isDecryptionKeyAvailable = data.encrypted_dek && masterKey;
      if (!(!!sharingKey || isDecryptionKeyAvailable)) {
        throw new Error("Auth required: Decryption key is not available");
      }

      const cryptoUtils = new CryptoUtils();
      await decryptLetterData(data, cryptoUtils);
    };

    const loadAndDecryptLetter = async () => {
      try {
        const response: AxiosResponse<LetterResponseData> = await api.get(
          `${endpoints.LETTERS}${public_id}/`,
        );
        await processLetterData(response.data);
      } catch (err) {
        setLogTrace({
          message: `Failed to load letter ☹`,
          log: err instanceof Error ? err.message : "Unknown error",
          type: "ERROR",
        });
      }
    };

    loadAndDecryptLetter().then(() => setIsDecrypting(false));
  }, [public_id, sharingKey, masterKey]);

  useEffect(() => {
    if (
      !isDecrypting &&
      revealState === "REVEALED" &&
      decryptedCanvasData &&
      canvasRef.current
    ) {
      canvasRef.current.loadData(decryptedCanvasData);
    }
  }, [isDecrypting, revealState, decryptedCanvasData]);

  if (isDecrypting) {
    return (
      <div className="flex items-center h-screen w-screen justify-center bg-base-100 font-sans">
        <div className="fixed inset-0 bg-vig pointer-events-none" />
        <div className="text-center space-y-6 z-10">
          <Logo />
          <div className="flex flex-col items-center gap-2">
            <span className="loading loading-ring loading-md text-primary/40"></span>
            <p
              data-testid="decryption-overlay"
              className="text-xs uppercase tracking-widest text-base-content/20 animate-pulse"
            >
              Breaking the seal...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (logTrace) {
    return (
      <LogModal
        isOpen={!!logTrace}
        onClose={() => {
          if (logTrace.type === "ERROR") window.location.href = "/";
          setLogTrace(null);
        }}
        message={logTrace.message}
        log={logTrace.log}
        status={logTrace.type}
      />
    );
  }

  return (
    <section className="min-h-fit w-full bg-base-100 px-4 py-8 md:py-16 font-serif relative overflow-hidden">
      <div className="fixed inset-0 bg-vig pointer-events-none z-0" />
      <div
        className={`transition-all delay-300 duration-1000 relative ${
          revealState === "REVEALED"
            ? "opacity-0 w-0 h-0 overflow-hidden invisible"
            : "opacity-100"
        }`}
      >
        {revealState === "SEALED" && (
          <div className="h-[80vh] mx-auto flex-col items-center flex justify-center">
            <div className="perspective-distant scale-80 duration-1000 transition-all animate-[pulse_2s_linear_1]">
              <EnvelopeReveal
                recipient={metadata?.recipient || "Someone dear"}
                date={
                  metadata?.updated_at
                    ? formatDate(new Date(metadata.updated_at))
                    : undefined
                }
                onRevealComplete={() => setRevealState("REVEALED")}
                ignite={ignite}
              />
            </div>
          </div>
        )}
      </div>

      {ignite && <PostActionOverlay revealState={revealState} />}

      {revealState === "REVEALED" && (
        <div className="max-w-180 m-8 mx-auto space-y-8 h-full relative inset-0 z-100">
          <div className="relative group perspective-1000">
            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-75 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

            <div className="bg-paper shadow-warm rounded-sm overflow-hidden animate-[opacity_1s_ease-in-out_1]">
              <div className="p-1 md:p-2 bg-base-content/5 opacity-10 pointer-events-none absolute inset-0 z-10" />
              <ComposeCanvas ref={canvasRef} readOnly />
            </div>

            {metadata?.recipient && (
              <p className="text-center sm:hidden text-xxs uppercase tracking-widester text-base-content/20 mt-8">
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

      {isAuthor && revealState !== "BURNED" && (
        <div className="flex justify-center gap-2 mt-8 z-10 relative">
          <button
            id="share-letter-btn"
            data-testid="share-letter-btn"
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
            data-testid="burn-letter-btn"
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
        <p className="text-xs font-sans uppercase tracking-widester">
          Read. Remember. Release.
        </p>
      </footer>
    </section>
  );
}
