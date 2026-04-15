import {
  ClockIcon,
  DownloadSimpleIcon,
  ImageIcon,
  LockIcon,
  SpinnerGapIcon,
  TrayIcon,
  XCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import {
  type NavigateFunction,
  useNavigate,
  useParams,
} from "react-router-dom";
import { api } from "../api/apiClient";
import {
  type CanvasTools,
  ComposeCanvas,
} from "../components/ui/ComposeCanvas";
import DateDisplay from "../components/ui/DateDisplay";
import { LogModal } from "../components/ui/LogModal";
import { Navbar } from "../components/ui/Navbar";
import { endpoints } from "../config/endpoints";
import { PATHS } from "../config/routes";
import { useKeyStore } from "../store/useKeyStore";
import { CryptoUtils } from "../utils/crypto";
import { formatRelativeDate } from "../utils/dateFormat";
import { decryptCanvasImages, encryptCanvasImages } from "../utils/letterLogic";

type SaveOverlay = "idle" | "saving" | "saved" | "error";

const OVERLAY_FADE_MS = 250;
const SAVED_VISIBLE_MS = 1400;
const ERROR_VISIBLE_MS = 2400;

export default function Editor() {
  const navigate = useNavigate();
  const navigateRef = useRef<NavigateFunction>(navigate);
  navigateRef.current = navigate;

  const { public_id } = useParams();
  const letterIdRef = useRef<string>(public_id ?? "");
  const justSavedRef = useRef<boolean>(false);

  const [decryptionStatus, setDecryptionStatus] = useState<{
    status: "SUCCESS" | "WARN" | "ERROR" | "RESET";
    message: string;
    log: string;
  }>({ status: "RESET", message: "", log: "" });

  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [status, setStatus] = useState<"DRAFT" | "SEALED">("DRAFT");
  const [isSaveDatePulsing, setIsSaveDatePulsing] = useState(false);
  const [lastSavedPulseTick, setLastSavedPulseTick] = useState(0);

  const [saveOverlay, setSaveOverlay] = useState<SaveOverlay>("idle");
  const [showSaveOverlay, setShowSaveOverlay] = useState(false);

  const [recipient, setRecipient] = useState("");
  const { masterKey } = useKeyStore();

  const canvasRef = useRef<CanvasTools>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!(public_id && masterKey)) return;
    if (justSavedRef.current) {
      justSavedRef.current = false;
      return;
    }

    const loadExistingLetter = async () => {
      setIsInitialLoading(true);
      const cryptoUtils = new CryptoUtils();

      try {
        const res = await api.get(`${endpoints.LETTERS}${public_id}/`);
        const letterData = res.data;

        setLastSaved(formatRelativeDate(new Date(letterData.updated_at)));
        setStatus(letterData.status);

        if (letterData.status === "SEALED") {
          navigateRef.current(PATHS.read(public_id), { replace: true });
          return;
        }

        if (!letterData.encrypted_dek) {
          return;
        }

        const metadata = await cryptoUtils.decryptMetadata(
          {
            encrypted_content: letterData.encrypted_metadata,
            encrypted_dek: letterData.encrypted_dek,
          },
          masterKey,
        );
        setRecipient(metadata.recipient || "");

        const decryptedJsonStr = await cryptoUtils.decryptLetter(
          {
            encrypted_content: letterData.encrypted_content,
            encrypted_dek: letterData.encrypted_dek,
          },
          masterKey,
        );
        const canvasData = JSON.parse(decryptedJsonStr);

        const { isDecryptionPartialFailure, error } = await decryptCanvasImages(
          canvasData,
          letterData.images ?? [],
          letterData.encrypted_dek,
          masterKey,
          cryptoUtils,
          true,
        );

        if (isDecryptionPartialFailure) {
          setDecryptionStatus({
            status: "WARN",
            message:
              "Failed to decrypt some elements. Please check the render.",
            log: error,
          });
        }

        console.log(canvasData);

        if (canvasRef.current) {
          await canvasRef.current.loadData(canvasData);
        }
      } catch (_err) {
        setDecryptionStatus({
          status: "ERROR",
          message: "Failed to decrypt letter. Please try again later.",
          log: _err instanceof Error ? _err.message : "Unknown error",
        });
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadExistingLetter();
  }, [public_id, masterKey]);

  useEffect(() => {
    if (lastSavedPulseTick === 0) return;

    setIsSaveDatePulsing(true);

    const timer = setTimeout(() => {
      setIsSaveDatePulsing(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, [lastSavedPulseTick]);

  useEffect(() => {
    if (saveOverlay === "idle" || saveOverlay === "saving") return;

    const visibleTimer = setTimeout(
      () => {
        setShowSaveOverlay(false);
      },
      saveOverlay === "saved" ? SAVED_VISIBLE_MS : ERROR_VISIBLE_MS,
    );

    const unmountTimer = setTimeout(
      () => {
        setSaveOverlay("idle");
      },
      (saveOverlay === "saved" ? SAVED_VISIBLE_MS : ERROR_VISIBLE_MS) +
        OVERLAY_FADE_MS,
    );

    return () => {
      clearTimeout(visibleTimer);
      clearTimeout(unmountTimer);
    };
  }, [saveOverlay]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      canvasRef.current?.addImage(url, file);
    }
  };

  const handleSave = async (status: "SEALED" | "DRAFT"): Promise<void> => {
    let targetId = public_id || letterIdRef.current;
    if (!targetId) {
      targetId = crypto.randomUUID();
    }

    if (saveOverlay === "saving" || !masterKey) return;

    setSaveOverlay("saving");
    setShowSaveOverlay(true);

    const cryptoUtils = new CryptoUtils();
    await cryptoUtils.initialize();

    try {
      const canvasData = canvasRef.current?.getData() || { objects: [] };
      const canvasImages = canvasRef.current?.getImages() || [];

      const encImageFilesMap = await encryptCanvasImages(
        canvasData,
        canvasImages,
        masterKey,
        cryptoUtils,
      );

      const encrypted_letter = await cryptoUtils.encryptLetter(
        JSON.stringify(canvasData),
        masterKey,
      );

      const encrypted_metadata = await cryptoUtils.encryptMetadata(
        { recipient, tags: [] },
        masterKey,
      );

      const formData = new FormData();
      formData.append("public_id", targetId);
      formData.append("type", "KEPT");
      formData.append("status", status);
      formData.append("encrypted_content", encrypted_letter.encrypted_content);
      formData.append("encrypted_dek", encrypted_letter.encrypted_dek);
      formData.append(
        "encrypted_metadata",
        encrypted_metadata.encrypted_content,
      );

      encImageFilesMap.forEach((blob, filename) => {
        formData.append("image_files", blob, filename);
      });

      await api.put(`${endpoints.LETTERS}${targetId}/`, formData);
      justSavedRef.current = true;

      if (!public_id) {
        letterIdRef.current = targetId;
        navigate(PATHS.write(targetId), { replace: true });
      }

      setLastSaved(formatRelativeDate(new Date()));
      setStatus(status);
      setLastSavedPulseTick((prev) => prev + 1);

      if (status === "SEALED" && encrypted_letter.sharingKey) {
        const link = `${window.location.origin}${PATHS.read(
          targetId,
        )}#${encrypted_letter.sharingKey}`;
        setShareLink(link);
        setShowSaveOverlay(false);
        setTimeout(() => setSaveOverlay("idle"), OVERLAY_FADE_MS);
      } else {
        setSaveOverlay("saved");
        setShowSaveOverlay(true);
      }
    } catch (_error) {
      setSaveOverlay("error");
      setShowSaveOverlay(true);
    }
  };

  const copyToClipboard = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
  };

  return (
    <>
      <Navbar
        child={
          <div
            className={`flex items-center gap-2 ${
              isSaveDatePulsing ? "animate-pulse" : ""
            }`}
          >
            <ClockIcon
              size={16}
              weight="bold"
              className="text-neutral-content/30"
            />
            <p className="text-sm text-neutral-content/30 flex-col justify-end leading-none text-right">
              <span className="text-[10px] uppercase tracking-widest font-bold">
                Last Save
              </span>
              <br />
              <span className="italic">{lastSaved}</span>
            </p>
          </div>
        }
      />

      <section className="flex-1 overflow-y-auto scrollbar-hide px-2 pt-32 pb-12 bg-base-300 relative">
        <LogModal
          status={decryptionStatus.status}
          message={decryptionStatus.message}
          log={decryptionStatus.log}
          onClose={() =>
            setDecryptionStatus({ status: "RESET", message: "", log: "" })
          }
          isOpen={decryptionStatus.status !== "RESET"}
        />

        {isInitialLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-base-300/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <SpinnerGapIcon
                size={48}
                weight="bold"
                className="animate-spin text-primary"
              />
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-base-content/40">
                Opening your draft...
              </p>
            </div>
          </div>
        )}

        {shareLink && (
          <div className="modal modal-open modal-bottom sm:modal-middle bg-base-100/20 backdrop-blur-md z-100">
            <div className="modal-box bg-base-100 border border-base-content/5 shadow-2xl relative">
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onClick={() => setShareLink(null)}
                aria-label="Close"
              >
                <XCircleIcon size={18} weight="bold" />
              </button>
              <div className="flex flex-col items-center text-center gap-6 py-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <LockIcon size={32} weight="fill" className="text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-3xl">Sealed & Ready</h3>
                  <p className="text-base-content/60 text-sm max-w-xs">
                    This letter is now encrypted. Share this secret link with
                    your recipient.
                  </p>
                </div>

                <div className="w-full flex items-center gap-2 bg-base-300 p-2 rounded-xl group relative">
                  <input
                    readOnly
                    value={shareLink}
                    className="flex-1 bg-transparent text-xs font-mono px-2 overflow-hidden text-ellipsis whitespace-nowrap outline-none"
                  />
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="btn btn-primary btn-sm rounded-lg"
                  >
                    Copy
                  </button>
                </div>

                <p className="text-[10px] uppercase tracking-widest text-base-content/30">
                  Zero-Knowledge: The key is in the link, not our servers.
                </p>
              </div>
            </div>
          </div>
        )}

        {saveOverlay !== "idle" && !shareLink && (
          <div
            className={`modal modal-open bg-base-100/20 backdrop-blur-md transition-opacity duration-300 ${
              showSaveOverlay ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="modal-box p-0 bg-transparent shadow-none transition-all duration-300">
              {saveOverlay === "saving" && (
                <div
                  role="alert"
                  className={`alert text-center alert-neutral shadow-lg transition-all ease-in-out duration-2000 ${
                    showSaveOverlay
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-95 translate-y-1"
                  }`}
                >
                  <SpinnerGapIcon
                    size={18}
                    weight="bold"
                    className="animate-spin"
                  />
                  <span className="font-bold">Securing your letter...</span>
                </div>
              )}

              {saveOverlay === "saved" && (
                <div
                  role="alert"
                  className={`alert alert-success shadow-lg transition-all ease-in-out duration-2000 ${
                    showSaveOverlay
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-95 translate-y-1"
                  }`}
                >
                  <DownloadSimpleIcon size={18} weight="bold" />
                  <span className="font-bold">Your letter is saved!</span>
                </div>
              )}

              {saveOverlay === "error" && (
                <div
                  role="alert"
                  className={`alert alert-error shadow-lg transition-all duration-300 ${
                    showSaveOverlay
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-95 translate-y-1"
                  }`}
                >
                  <XIcon size={18} weight="bold" />
                  <span className="font-bold">Failed to save letter</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="max-w-180 mx-auto px-1 md:px-0">
          <div className="flex justify-between items-end mb-16 border-b border-base-content/5 pb-8 px-0">
            <div className="flex flex-col gap-2 flex-1">
              <label
                htmlFor="recipient"
                className="text-[10px] uppercase tracking-[0.4em] text-secondary-content font-bold"
              >
                Recipient
              </label>
              <input
                id="recipient"
                type="text"
                placeholder="Someone dear..."
                value={recipient}
                disabled={status === "SEALED"}
                onChange={(e) => setRecipient(e.target.value)}
                className="bg-transparent border-none outline-none text-2xl md:text-3xl lg:text-4xl font-serif text-base-content placeholder:text-base-content/10 w-full disabled:opacity-50"
              />
            </div>
            <DateDisplay />
          </div>

          {status === "DRAFT" ? (
            <div
              id="writer-toolbar"
              className="flex items-center justify-between mb-8 h-14 bg-base-100/50 backdrop-blur-md rounded-full border border-base-content/5 px-6"
            >
              <div className="flex gap-4">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={18} weight="bold" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-[10px] tracking-[0.2em] uppercase font-bold text-base-content/60 hover:text-base-content"
                  title="Store in your private drawer"
                  onClick={() => handleSave("DRAFT")}
                >
                  <TrayIcon size={18} weight="bold" />
                  <span className="hidden md:inline">Store</span>
                </button>

                <div className="w-px h-4 bg-base-content/10 mx-2" />

                <button
                  type="button"
                  className="btn btn-primary btn-sm rounded-full px-6"
                  onClick={() => handleSave("SEALED")}
                >
                  <LockIcon size={14} weight="fill" className="mr-1" />
                  Seal
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center mb-8 h-14">
              <div className="badge badge-outline border-primary/20 bg-primary/5 text-primary gap-2 p-4 rounded-full">
                <LockIcon size={14} weight="fill" />
                <span className="text-[10px] uppercase tracking-widest font-bold">
                  Sealed & View Only
                </span>
              </div>
            </div>
          )}

          <ComposeCanvas ref={canvasRef} readOnly={status === "SEALED"} />
        </div>
      </section>
    </>
  );
}
