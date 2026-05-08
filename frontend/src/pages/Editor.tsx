import {
  ClockIcon,
  DownloadSimpleIcon,
  SpinnerGapIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import {
  type NavigateFunction,
  useNavigate,
  useParams,
} from "react-router-dom";
import { api } from "../api/apiClient";
import type { LetterResponseData } from "../api/response";
import {
  type CanvasStyle,
  type CanvasTools,
  ComposeCanvas,
} from "../components/editor/ComposeCanvas";
import { PostSealModal } from "../components/editor/PostSealModal";
import {
  LetterHead,
  ToolBar,
  VaultConfirmModal,
} from "../components/editor/ToolBar";
import DateDisplay from "../components/ui/DateDisplay";
import { LogModal } from "../components/ui/LogModal";
import { Modal } from "../components/ui/Modal";
import { Navbar } from "../components/ui/Navbar";
import { endpoints } from "../config/endpoints";
import { PATHS } from "../config/routes";
import { useKeyStore } from "../store/useKeyStore";
import { CryptoUtils } from "../utils/crypto";
import { formatRelativeDate } from "../utils/dateFormat";
import { decryptCanvasImages, encryptCanvasImages } from "../utils/letterLogic";

type SaveOverlay = "IDLE" | "SAVING" | "SAVED" | "ERROR";

const OVERLAY_FADE_MS = 250;
const SAVED_VISIBLE_MS = 1400;
const ERROR_VISIBLE_MS = 2400;
const STOP_SAVE_DATE_PULSE_AFTER_MS = 10000;

const toPlaceholderList = [
  "Someone dear...",
  "Somewhere near...",
  "Something to bear...",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
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
  const [sealedTargetId, setSealedTargetId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [status, setLetterStatus] = useState<"DRAFT" | "SEALED" | "VAULT">(
    "DRAFT",
  );
  const [isSaveDatePulsing, setIsSaveDatePulsing] = useState(false);
  const [lastSavedPulseTick, setLastSavedPulseTick] = useState(0);
  const [sealBtnClicked, setSealBtnClicked] = useState<boolean>(false);

  const [saveOverlay, setSaveOverlay] = useState<SaveOverlay>("IDLE");
  const [logStatus, setLogStatus] = useState<{
    status: "WARN" | "ERROR" | "RESET";
    message: string;
  }>({
    status: "RESET",
    message: "",
  });
  const [showSaveOverlay, setShowSaveOverlay] = useState(false);
  const [confirmModal, setConfirmModal] = useState<"VAULT" | "SEAL" | null>(
    null,
  );

  const [recipient, setRecipient] = useState("");
  const [unlockDate, setUnlockDate] = useState<Date | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [canvasFontStyle, setCanvasFontStyle] = useState<CanvasStyle>({
    fontColor: "",
    fontFamily: "",
  });

  const { masterKey } = useKeyStore();

  const canvasRef = useRef<CanvasTools>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // to continuously rotate placeholder text of the recipient input
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % toPlaceholderList.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // to load existing letter when public_id param and masterKey is available
  // NOTE: this has to trigger just once after each save
  useEffect(() => {
    if (!(public_id && masterKey)) return;
    if (justSavedRef.current) {
      justSavedRef.current = false;
      return;
    }
    const decryptAndLoadLetter = async (
      letterData: LetterResponseData,
      masterKey: CryptoKey,
    ) => {
      const cryptoUtils = new CryptoUtils();
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

      const { errors, isPartialFailure, canvasDataWithDecryptedImages } =
        await decryptCanvasImages(
          canvasData,
          letterData.images ?? [],
          letterData.encrypted_dek,
          masterKey,
          cryptoUtils,
          true,
        );

      if (isPartialFailure) {
        setDecryptionStatus({
          status: "WARN",
          message: "Failed to decrypt some elements. Please check the render.",
          log: errors.toString(),
        });
      }

      if (canvasRef.current) {
        await canvasRef.current.loadData(canvasDataWithDecryptedImages);
      }
    };

    const loadExistingLetter = async () => {
      setIsInitialLoading(true);
      try {
        const res = await api.get(`${endpoints.LETTERS}${public_id}/`);
        const letterData = res.data;

        setLastSaved(formatRelativeDate(new Date(letterData.updated_at)));
        setLetterStatus(letterData.status);

        if (letterData.status === "SEALED") {
          navigateRef.current(PATHS.read(public_id), { replace: true });
          return;
        }

        if (letterData.encrypted_dek && masterKey) {
          await decryptAndLoadLetter(letterData, masterKey);
        }
      } catch (err) {
        setDecryptionStatus({
          status: "ERROR",
          message: "Failed to decrypt letter. Please try again later.",
          log: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadExistingLetter().then((_) => {
      if (canvasRef.current) {
        setCanvasFontStyle(canvasRef.current.getStyle());
      }
    });
  }, [public_id, masterKey]);

  // to trigger short pulse animation for Last Saved AT element
  useEffect(() => {
    if (lastSavedPulseTick === 0) return;
    setIsSaveDatePulsing(true);

    const timer = setTimeout(() => {
      setIsSaveDatePulsing(false);
    }, STOP_SAVE_DATE_PULSE_AFTER_MS);

    return () => clearTimeout(timer);
  }, [lastSavedPulseTick]);

  // to fade in and fade out the save status overlay after each save operation
  // Note: otherwise the fade efect is abrupt due to component's immediate unmount
  useEffect(() => {
    if (saveOverlay === "IDLE" || saveOverlay === "SAVING") return;
    const visibleTimer = setTimeout(
      () => {
        setShowSaveOverlay(false);
      },
      saveOverlay === "SAVED" ? SAVED_VISIBLE_MS : ERROR_VISIBLE_MS,
    );
    const unmountTimer = setTimeout(
      () => {
        setSaveOverlay("IDLE");
      },
      (saveOverlay === "SAVED" ? SAVED_VISIBLE_MS : ERROR_VISIBLE_MS) +
        OVERLAY_FADE_MS,
    );

    return () => {
      clearTimeout(visibleTimer);
      clearTimeout(unmountTimer);
    };
  }, [saveOverlay]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size < MAX_FILE_SIZE) {
      const url = URL.createObjectURL(file);
      canvasRef.current?.addImage(url, file);
    } else {
      setLogStatus({
        status: "WARN",
        message: "Please upload images with size less than 10MB.",
      });
    }
  };

  const getRequestData = async (
    targetId: string,
    status: string,
    vaultDate?: Date,
  ): Promise<FormData> => {
    const cryptoUtils = new CryptoUtils();
    await cryptoUtils.initialize();

    const canvasData = (await canvasRef.current?.getData()) || { objects: [] };
    const canvasImages = canvasRef.current?.getImages() || [];

    const { encryptedImageFiles, encryptedCanvasData } =
      await encryptCanvasImages(
        canvasData,
        canvasImages,
        // biome-ignore lint/style/noNonNullAssertion: masterkey can never be null here
        masterKey!,
        cryptoUtils,
      );

    const encrypted_letter = await cryptoUtils.encryptLetter(
      JSON.stringify(encryptedCanvasData),
      // biome-ignore lint/style/noNonNullAssertion: masterkey can never be null here
      masterKey!,
    );

    const encrypted_metadata = await cryptoUtils.encryptMetadata(
      { recipient, tags: [] },
      // biome-ignore lint/style/noNonNullAssertion: masterkey can never be null here
      masterKey!,
    );

    const formData = new FormData();
    if (status === "VAULT") {
      const finalDate = vaultDate || unlockDate;
      formData.append("type", "VAULT");
      if (finalDate) formData.append("unlock_at", finalDate.toISOString());
      formData.append("status", "SEALED");
    } else {
      formData.append("type", "KEPT");
      formData.append("status", status);
    }

    formData.append("public_id", targetId);
    formData.append("encrypted_content", encrypted_letter.encrypted_content);
    formData.append("encrypted_dek", encrypted_letter.encrypted_dek);
    formData.append("encrypted_metadata", encrypted_metadata.encrypted_content);

    encryptedImageFiles.forEach((blob, filename) => {
      formData.append("image_files", blob, filename);
    });

    return formData;
  };

  const handleSave = async (
    status: "SEALED" | "DRAFT" | "VAULT",
    vaultDate?: Date,
  ): Promise<void> => {
    setSealBtnClicked(false);
    // use the letter's id if an existing letter or create a new id
    const targetId = public_id || letterIdRef.current || crypto.randomUUID();

    if (saveOverlay === "SAVING" || !masterKey) return;

    setSaveOverlay("SAVING");
    setShowSaveOverlay(true);

    try {
      const formData = await getRequestData(targetId, status, vaultDate);
      await api.put(`${endpoints.LETTERS}${targetId}/`, formData);

      justSavedRef.current = true;
      if (!public_id) {
        letterIdRef.current = targetId;
        navigate(PATHS.write(targetId), { replace: true });
      }

      setLastSaved(formatRelativeDate(new Date()));
      setLetterStatus(status);
      setLastSavedPulseTick((prev) => prev + 1);

      if (status === "SEALED" || status === "VAULT") {
        setSealedTargetId(targetId);
      }
      setSaveOverlay("SAVED");
      setShowSaveOverlay(true);
    } catch {
      setSaveOverlay("ERROR");
      setShowSaveOverlay(true);
    }
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
            <div className="text-xxs text-neutral-content/30 flex-col justify-end leading-none text-right">
              <span className="uppercase tracking-widest font-bold">
                Last Save
              </span>
              <br />
              <span className="italic">{lastSaved}</span>
            </div>
            <ClockIcon
              size={16}
              weight="bold"
              className="text-neutral-content/30"
            />
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
              <p
                data-testid="opening-draft-overlay"
                className="text-xxs uppercase tracking-widester font-bold text-base-content/40"
              >
                Opening your draft...
              </p>
            </div>
          </div>
        )}

        {saveOverlay !== "IDLE" && (
          <Modal isOpen={showSaveOverlay}>
            {saveOverlay === "SAVING" && (
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

            {saveOverlay === "SAVED" && (
              <div
                role="alert"
                data-testid="save-success-toast"
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

            {saveOverlay === "ERROR" && (
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
          </Modal>
        )}

        {confirmModal === "VAULT" && (
          <VaultConfirmModal
            onSave={handleSave}
            setConfirmModal={setConfirmModal}
            setUnlockDate={setUnlockDate}
          />
        )}
        {sealedTargetId && (
          <PostSealModal
            sealedTargetId={sealedTargetId}
            navigate={navigate}
            type={status === "VAULT" ? "VAULT" : "KEPT"}
          />
        )}

        <div className="max-w-180 mx-auto px-1 md:px-0">
          <div className="flex justify-between items-end mb-16 border-b border-base-content/5 pb-8 px-0">
            <div className="flex flex-col gap-2 flex-1">
              <label
                htmlFor="recipient"
                className="text-xxs uppercase tracking-widester text-secondary-content font-bold"
              >
                Recipient
              </label>
              <input
                id="recipient"
                data-testid="recipient-input"
                type="text"
                placeholder={toPlaceholderList[placeholderIndex]}
                value={recipient}
                disabled={status !== "DRAFT"}
                onChange={(e) => setRecipient(e.target.value)}
                className="bg-transparent border-none outline-none text-2xl md:text-3xl lg:text-4xl font-serif text-base-content placeholder:text-base-content/10 w-full disabled:opacity-50"
              />
            </div>
            <DateDisplay />
          </div>

          {status === "DRAFT" ? (
            <ToolBar
              onAddImage={() => fileInputRef.current?.click()}
              sealBtnClicked={sealBtnClicked}
              setSealBtnClicked={setSealBtnClicked}
              onSave={handleSave}
              setConfirmModal={setConfirmModal}
              onFontChange={setCanvasFontStyle}
              latestFontStyle={canvasFontStyle}
            />
          ) : (
            <LetterHead />
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          <ComposeCanvas
            ref={canvasRef}
            readOnly={status !== "DRAFT"}
            style={canvasFontStyle}
          />
        </div>
      </section>
      <LogModal
        status={logStatus.status}
        message={logStatus.message}
        log={""}
        onClose={() =>
          setLogStatus({
            status: "RESET",
            message: "",
          })
        }
        isOpen={logStatus.status !== "RESET"}
      />
    </>
  );
}
