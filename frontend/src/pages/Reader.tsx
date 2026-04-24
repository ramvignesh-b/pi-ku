import {
  CampfireIcon,
  EyeSlashIcon,
  FlameIcon,
  PaperPlaneTiltIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/apiClient";
import Logo from "../components/Logo";
import {
  type CanvasJSON,
  type CanvasTools,
  ComposeCanvas,
} from "../components/ui/ComposeCanvas";
import { EnvelopeReveal } from "../components/ui/EnvelopeReveal";
import { LogModal } from "../components/ui/LogModal";
import { endpoints } from "../config/endpoints";
import { PATHS, ROUTES } from "../config/routes";
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

  const canvasRef = useRef<CanvasTools>(null);

  const [isDecrypting, setIsDecrypting] = useState(true);
  const [revealState, setRevealState] = useState<
    "sealed" | "revealed" | "burned"
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

  const copyToClipboard = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
  };

  function ShareModal() {
    return (
      <div className="modal modal-open modal-middle bg-base-100/20 backdrop-blur-md z-100">
        <div className="modal-box bg-base-100 border border-base-content/5 shadow-2xl relative">
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={() => setShareLink(null)}
            aria-label="Close"
          >
            <XCircleIcon size={18} weight="bold" />
          </button>
          <div className="flex flex-col items-center justify-center text-center gap-6 py-4">
            <div className="space-y-2">
              <PaperPlaneTiltIcon
                size={48}
                weight="bold"
                className="mb-4 text-primary mx-auto animate-[bounce_3s_ease-in-out_infinite]"
              />
              <h3 className="font-serif text-3xl">Send this letter</h3>
              <p className="text-base-content/80 text-sm font-sans mt-4">
                You've carried these words long enough. Send your letter now,
                and let the{" "}
                <span className="text-accent font-display">unsaid</span> finally
                find its home.
              </p>
              <div className="divider mx-auto" />
              <blockquote className="text-sm info text-neutral-content/60 font-sans">
                The recipient will have the same viewing experience like you do
                now.
              </blockquote>
            </div>
            <div className="w-full flex items-center gap-2 bg-base-300 p-2 rounded-xl">
              <input
                id="share-link-input"
                readOnly
                value={shareLink ?? ""}
                className="flex-1 bg-transparent text-xs font-mono px-2 overflow-hidden text-ellipsis whitespace-nowrap outline-none"
              />
              <button
                type="button"
                onClick={copyToClipboard}
                className="btn btn-primary font-sans btn-sm rounded-tl-xl rounded-bl-xl rounded-tr-full rounded-br-full"
              >
                Copy
              </button>
            </div>
            <div className="flex flex-col gap-1 uppercase tracking-widest text-base-content/30 font-sans">
              <p className="textarea-xs flex items-center justify-center">
                <EyeSlashIcon weight="duotone" size={18} className="mr-2" />{" "}
                Zero-Knowledge Share:
              </p>
              <p className="textarea-xs font-mono text-center">
                The key never leaves your or the recipient's browser.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  function BurnModal() {
    const [flameOn, setFlameOn] = useState(0);
    const [rotate, setRotate] = useState(0);
    const [burnClicked, setBurnClicked] = useState(false);
    useEffect(() => {
      if (!burnClicked) return;
      if (flameOn === 100) {
        setRevealState("sealed");
        burnLetter();
      }
      const interval = setInterval(() => {
        setFlameOn((prev) => prev + 1);
        setRotate(Math.random() * 4 - 2);
      }, 100);
      return () => clearInterval(interval);
    }, [burnClicked, flameOn]);

    const burnStyle = flameOn < 30 ? "" : `contrast(${flameOn / 30})`;

    return (
      <div className="modal modal-open modal-middle bg-base-100/20 backdrop-blur-md">
        <div
          className={`modal-box flex flex-col items-center gap-4 py-8 text-center transition-all duration-200 ease-in-out ${burnClicked ? "animate-[pulse_15s_linear_infinite]" : ""}`}
          style={
            {
              transform: `rotate(${rotate}deg)`,
            } as React.CSSProperties
          }
        >
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={() => setShowBurnModal(false)}
            aria-label="Close"
          >
            <XCircleIcon size={18} weight="bold" />
          </button>
          <CampfireIcon
            size={48}
            weight="duotone"
            className="text-error animate-pulse"
          />
          <h3 className="font-serif text-2xl">
            Are you ready to burn this letter?
          </h3>
          <p className="text-sm font-sans text-base-content/80 mt-4">
            Some words are meant to be unsaid, but they don't have to linger
            forever.
            <br />
            Let the echoes of your unsaid be finally released.
          </p>
          <div className="mt-4 font-sans text-sm">
            <span className="text-error">Press</span> and{" "}
            <span className="text-error">hold</span> the{" "}
            <span className="text-amber-300">flame</span> to proceed.
          </div>
          <div className="modal-action w-full justify-center gap-3 mt-2">
            <div
              className="absolute -mt-2 w-28 h-28 radial-progress pointer-events-none text-amber-200/60"
              style={
                { "--value": flameOn, filter: burnStyle } as React.CSSProperties
              }
              role="progressbar"
            ></div>
            <button
              type="button"
              className={`btn btn-error btn-dashed btn-circle w-24 h-24`}
              style={
                {
                  filter: burnStyle,
                  cursor: burnClicked ? "grabbing" : "grab",
                } as React.CSSProperties
              }
              // onClick={handleBurn}
              onMouseDown={() => setBurnClicked(true)}
              onMouseUp={() => {
                setFlameOn(0);
                setBurnClicked(false);
              }}
              disabled={isBurning}
            >
              {isBurning ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <FlameIcon size={54} weight="duotone" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!(sharingKey || masterKey)) {
      setError({
        message:
          "No sharing key provided. Please check the link or log in if you are the author.",
        log: "",
      });
      setIsDecrypting(false);
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
        className={`transition-all duration-1000 relative ${
          revealState === "revealed"
            ? "opacity-0 w-0 h-0 overflow-hidden invisible"
            : "opacity-100"
        }`}
      >
        {revealState === "sealed" && (
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
        )}
      </div>

      {ignite && (
        <div
          className={`flex flex-col items-center justify-center min-h-screen bg-base-100 ${revealState === "burned" ? "opacity-100" : "opacity-0"} transition-all delay-300 duration-1000`}
        >
          <h1
            className={`text-6xl ${revealState === "burned" ? "opacity-100" : "opacity-0"} lg:text-9xl italic font-extralight text-base-content animate-[pulse_3s_ease-in-out_3]`}
          >
            It is done
          </h1>
          <div
            className={`text-xl ${revealState === "burned" ? "opacity-100" : "opacity-0"} lg:text-4xl text-center font-extralight text-base-content font-display mt-8 delay-3000 transition-all duration-2000 tracking-wide`}
          >
            <p className="w-full">
              May your <span className="italic text-primary">soul</span> find
              solace,
              <br />
              just like your <span className="text-accent italic">unsaid</span>{" "}
              words did.
            </p>
            <div className="divider mx-auto w-24 text-center"></div>
            <button
              type="button"
              className="btn btn-ghost text-sm text-neutral-content/60 font-sans"
              onClick={() => navigate(ROUTES.DRAWER)}
            >
              Turn the page
            </button>
          </div>
        </div>
      )}

      <LogModal
        isOpen={!!warning}
        onClose={() => setWarning(null)}
        message={warning?.message || ""}
        log={warning?.log || ""}
        status="WARN"
      />

      {revealState === "revealed" && (
        <div className="max-w-4xl m-8 mx-auto space-y-8 relative inset-0 z-100">
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

      {shareLink && <ShareModal />}
      {showBurnModal && <BurnModal />}

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
              Send to someone...
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
