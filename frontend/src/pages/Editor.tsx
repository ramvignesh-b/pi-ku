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
import { ROUTES } from "../config/routes";
import { useKeyStore } from "../store/useKeyStore";
import { CryptoUtils } from "../utils/crypto";

// convert blob url to file
async function blobUrlToFile(
  blobUrl: string,
  fileName: string,
  mimeType?: string,
): Promise<File> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: mimeType ?? blob.type });
}

export default function Editor() {
  const navigate = useNavigate();
  const { public_id } = useParams();
  const letterIdRef = useRef<string>(public_id ?? "");

  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isSealing, setIsSealing] = useState(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);

  const [recipient, setRecipient] = useState("");
  const { masterKey } = useKeyStore();

  const canvasRef = useRef<CanvasTools>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial load: Fetch and decrypt existing letter
  useEffect(() => {
    if (!public_id || !masterKey) return;

    const loadExistingLetter = async () => {
      setIsInitialLoading(true);
      const cryptoUtils = new CryptoUtils();
      try {
        const res = await api.get(`${endpoints.LETTERS}${public_id}/`);
        const letterData = res.data;

        // metadata for recipient
        const metadata = await cryptoUtils.decryptMetadata(
          {
            encrypted_content: letterData.encrypted_metadata,
            encrypted_dek: letterData.encrypted_dek,
          },
          masterKey,
        );
        setRecipient(metadata.recipient || "");

        // decrypt canvas data
        const decryptedJsonStr = await cryptoUtils.decryptLetter(
          {
            encrypted_content: letterData.encrypted_content,
            encrypted_dek: letterData.encrypted_dek,
          },
          masterKey,
        );
        const canvasData = JSON.parse(decryptedJsonStr);

        // traverse through canvas images and replace encrypted image with decrypted image
        if (canvasData.objects) {
          for (const obj of canvasData.objects) {
            if (obj.type === "Image" && typeof obj.src === "string") {
              const filename = obj.src;
              const remoteImage = letterData.images.find(
                (img: any) => img.file_name === filename,
              );

              if (remoteImage) {
                try {
                  // fetch encrypted image blob using authenticated API
                  const imageRes = await api.get(remoteImage.file, {
                    responseType: "blob",
                  });
                  const encryptedBlob = imageRes.data;

                  // decrypt image blob
                  const blobUrl = await cryptoUtils.decryptImage(
                    encryptedBlob,
                    letterData.encrypted_dek,
                    masterKey,
                  );
                  obj.src = blobUrl;
                  obj._customRawFile = await blobUrlToFile(blobUrl, filename);
                  console.log("Decrypted image object:", obj);
                } catch (imgErr) {
                  console.error(
                    "Failed to decrypt image object:",
                    filename,
                    imgErr,
                  );
                }
              }
            }
          }
        }

        // load updated data into canvas
        requestAnimationFrame(() => {
          canvasRef.current?.loadData(canvasData);
        });
      } catch (err) {
        console.error("Failed to load existing letter:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadExistingLetter();
  }, [public_id, masterKey]);

  // --------------------------------------------------------------------------------------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // pick one file at a time
    if (file) {
      const url = URL.createObjectURL(file);
      canvasRef.current?.addImage(url, file);
    }
  };

  const handleSave = async (status: "SEALED" | "DRAFT"): Promise<void> => {
    if (!public_id && !letterIdRef.current) {
      // if no uuid slug, then generate a new one and update params
      letterIdRef.current = crypto.randomUUID();
      navigate(ROUTES.WRITE(letterIdRef.current), { replace: true });
    } else if (public_id) {
      letterIdRef.current = public_id;
    }

    if (isSealing) return;
    setIsSealing(true);
    const cryptoUtils = new CryptoUtils();
    await cryptoUtils.initialize();

    const images = canvasRef.current?.getImages() || [];
    const imageEncMap = new Map<string, string>();
    const encImageFilesMap = new Map<string, Blob>();

    if (!masterKey) {
      throw new Error("Master key is not initialized");
    }

    for (const image of images) {
      if (image.src.endsWith(".bin")) continue;
      try {
        const encrypted_image = await cryptoUtils.encryptImage(
          image.file,
          masterKey,
        );
        imageEncMap.set(image.src, encrypted_image.filename);
        encImageFilesMap.set(
          encrypted_image.filename,
          encrypted_image.encryptedBlob,
        );
      } catch (err) {
        console.error("Failed to re-encrypt image:", err);
      }
    }

    // replace image src with encrypted image filename
    const canvasData = canvasRef.current?.getData();
    if (canvasData?.objects) {
      canvasData.objects = canvasData.objects.map((obj: any) => {
        if (obj.type === "Image" && imageEncMap.has(obj.src)) {
          return { ...obj, src: imageEncMap.get(obj.src) };
        }
        return obj;
      });
    }

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
    formData.append("encrypted_metadata", encrypted_metadata.encrypted_content);
    encImageFilesMap.forEach((image, filename) => {
      formData.append("image_files", image, filename);
    });

    try {
      await api.put(`${endpoints.LETTERS}${letterIdRef.current}/`, formData);
      setIsSaveSuccess(true);
      setTimeout(() => {
        setIsSaveSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Error sealing letter:", error);
    } finally {
      setIsSealing(false);
    }
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
      {isSaveSuccess && (
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
