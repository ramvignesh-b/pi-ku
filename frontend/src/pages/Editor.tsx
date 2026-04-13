import {
  DownloadSimpleIcon,
  ImageIcon,
  LockIcon,
  SpinnerGapIcon,
  TrayIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/apiClient";
import {
  type CanvasTools,
  ComposeCanvas,
} from "../components/ui/ComposeCanvas";
import DateDisplay from "../components/ui/DateDisplay";
import { endpoints } from "../config/endpoints";
import { PATHS } from "../config/routes";
import { useKeyStore } from "../store/useKeyStore";
import { CryptoUtils } from "../utils/crypto";
import { decryptCanvasImages, encryptCanvasImages } from "../utils/letterLogic";

export default function Editor() {
  const navigate = useNavigate();
  const { public_id } = useParams();
  const letterIdRef = useRef<string>(public_id ?? "");

  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isSealing, setIsSealing] = useState(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const [recipient, setRecipient] = useState("");
  const { masterKey } = useKeyStore();

  const canvasRef = useRef<CanvasTools>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial load: Fetch and decrypt existing letter
  useEffect(() => {
    if (!public_id || !masterKey) return;

    const loadExistingLetter = async () => {
      setIsInitialLoading(true);
      const crypto = new CryptoUtils();
      try {
        const res = await api.get(`${endpoints.LETTERS}${public_id}/`);
        const letterData = res.data;

        // Decrypt the metadata (for the recipient field)
        const metadata = await crypto.decryptMetadata(
          {
            encrypted_content: letterData.encrypted_metadata,
            encrypted_dek: letterData.encrypted_dek,
          },
          masterKey,
        );
        setRecipient(metadata.recipient || "");

        // Decrypt the main canvas JSON
        const decryptedJsonStr = await crypto.decryptLetter(
          {
            encrypted_content: letterData.encrypted_content,
            encrypted_dek: letterData.encrypted_dek,
          },
          masterKey,
        );
        const canvasData = JSON.parse(decryptedJsonStr);

        // Batch decrypt images within the canvas
        await decryptCanvasImages(
          canvasData,
          letterData.images,
          letterData.encrypted_dek,
          masterKey,
          true, // restore raw files for the editor
        );

        // Load data into the Fabric canvas
        requestAnimationFrame(() => {
          canvasRef.current?.loadData(canvasData);
        });
      } catch (_err) {
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadExistingLetter();
  }, [public_id, masterKey]);

  // --------------------------------------------------------------------------------------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      canvasRef.current?.addImage(url, file);
    }
  };

  const handleSave = async (status: "SEALED" | "DRAFT"): Promise<void> => {
    if (!public_id && !letterIdRef.current) {
      letterIdRef.current = crypto.randomUUID();
      navigate(PATHS.write(letterIdRef.current), { replace: true });
    } else if (public_id) {
      letterIdRef.current = public_id;
    }

    if (isSealing || !masterKey) return;
    setIsSealing(true);

    const cryptoUtils = new CryptoUtils();
    await cryptoUtils.initialize();

    try {
      const canvasData = canvasRef.current?.getData();
      const canvasImages = canvasRef.current?.getImages() || [];

      // Secure any new images first
      const encImageFilesMap = await encryptCanvasImages(
        canvasData,
        canvasImages,
        masterKey,
      );

      // Encrypt the updated canvas JSON
      const encrypted_letter = await cryptoUtils.encryptLetter(
        JSON.stringify(canvasData),
        masterKey,
      );

      const encrypted_metadata = await cryptoUtils.encryptMetadata(
        { recipient, tags: [] },
        masterKey,
      );

      const formData = new FormData();
      formData.append("public_id", letterIdRef.current);
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

      await api.put(`${endpoints.LETTERS}${letterIdRef.current}/`, formData);
      setIsSaveSuccess(true);

      if (status === "SEALED" && encrypted_letter.sharingKey) {
        const link = `${window.location.origin}${PATHS.read(letterIdRef.current)}#${encrypted_letter.sharingKey}`;
        setShareLink(link);
      }

      setTimeout(() => setIsSaveSuccess(false), 5000);
    } catch (_error) {
    } finally {
      setIsSealing(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
    } catch (_err) {}
  };

  return (
    <section className="flex-1 overflow-y-auto scrollbar-hide px-2 py-12 bg-base-300 relative">
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
      {/* Sharing Modal */}
      {shareLink && (
        <div className="modal modal-open modal-bottom sm:modal-middle bg-base-100/20 backdrop-blur-md z-[100]">
          <div className="modal-box bg-base-100 border border-base-content/5 shadow-2xl relative">
            <button
              type="button"
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setShareLink(null)}
            >
              ✕
            </button>
            <div className="flex flex-col items-center text-center gap-6 py-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <LockIcon size={32} weight="fill" className="text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-3xl">Sealed & Ready</h3>
                <p className="text-base-content/60 text-sm max-w-xs">
                  This letter is now encrypted. Share this secret link with your
                  recipient.
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

      {isSaveSuccess && !shareLink && (
        <div
          className="modal modal-open bg-base-100 backdrop-blur-md transition-all duration-2000 ease-in-out
        animate-fade-in opacity-80"
        >
          <div className="alert alert-success opacity-90">
            <DownloadSimpleIcon size={18} weight="bold" />
            <h3 className="font-bold text-lg text-success-content">
              Your letter is saved!
            </h3>
          </div>
        </div>
      )}
      {isSealing && (
        <div
          className="modal modal-open bg-base-100 backdrop-blur-md transition-all duration-2000 ease-in-out
        animate-fade-in opacity-80"
        >
          <div className="alert alert-neutral">
            <SpinnerGapIcon size={18} weight="bold" className="animate-spin" />
            <h3 className="font-bold text-neutral-content text-lg animate-pulse">
              Securing your letter...
            </h3>
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
              onChange={(e) => setRecipient(e.target.value)}
              className="bg-transparent border-none outline-none text-4xl font-serif text-base-content placeholder:text-base-content/10 w-full"
            />
          </div>
          <DateDisplay />
        </div>

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
        <ComposeCanvas ref={canvasRef} />
      </div>
    </section>
  );
}
