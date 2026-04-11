import {
  DownloadSimpleIcon,
  ImageIcon,
  LockIcon,
  TrayIcon,
} from "@phosphor-icons/react";
import type { FabricObject } from "fabric";
import { useRef, useState } from "react";
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

export default function Editor() {
  const { public_id } = useParams();
  const letterIdRef = useRef<string>(public_id ?? null);
  const navigate = useNavigate();
  const [isSealing, setIsSealing] = useState(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);

  const [recipient, setRecipient] = useState("");
  const masterKey = useKeyStore.getState().masterKey;

  const canvasRef = useRef<CanvasTools>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // pick one file at a time
    if (file) {
      const url = URL.createObjectURL(file);
      canvasRef.current?.addImage(url, file);
    }
  };

  async function handleSeal(): Promise<void> {
    if (!public_id) {
      letterIdRef.current = crypto.randomUUID();
      navigate(ROUTES.WRITE(letterIdRef.current), { replace: true });
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
      const encrypted_image = await cryptoUtils.encryptImage(
        image.file,
        masterKey,
      );
      imageEncMap.set(image.src, encrypted_image.filename);
      encImageFilesMap.set(
        encrypted_image.filename,
        encrypted_image.encryptedBlob,
      );
    }

    // replace image src with encrypted image filename
    const canvasData = canvasRef.current?.getData() ?? { objects: [] };
    canvasData.objects = canvasData.objects?.map(
      (obj: FabricObject & { src: string }) =>
        obj.type === "Image" ? { ...obj, src: imageEncMap.get(obj.src) } : obj,
    );

    const encrypted_letter = await cryptoUtils.encryptLetter(
      JSON.stringify(canvasData),
      masterKey,
    );
    const encrypted_metadata = "";

    // upload to server
    /*
    payload = {
            "type": "SENT",
            "status": "SEALED",
            "encrypted_content": "enc_content==",
            "encrypted_metadata": "enc_metadata==",
            "encrypted_dek": "enc_dek==",
            "image_files": [image1, image2],
        }
    */
    const formData = new FormData();
    formData.append("public_id", letterIdRef.current);
    formData.append("type", "SENT");
    formData.append("status", "SEALED");
    formData.append("encrypted_content", encrypted_letter.encrypted_content);
    formData.append("encrypted_dek", encrypted_letter.encrypted_dek);
    formData.append("encrypted_metadata", encrypted_metadata);
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
  }

  return (
    <section className="flex-1 overflow-y-auto scrollbar-hide px-2 py-12 bg-base-300">
      {isSaveSuccess && (
        <div className="modal modal-open bg-transparent backdrop-blur-md transition-all duration-300 ease-in-out">
          <div className="modal-box bg-transparent">
            <div className="alert alert-success">
              <DownloadSimpleIcon size={18} weight="bold" />
              <h3 className="font-bold text-lg">Your letter is sealed!</h3>
            </div>
            {/* <div className="modal-action">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsSaveSuccess(false)}
              >
                Close
              </button>
            </div> */}
          </div>
        </div>
      )}
      <div className="max-w-[720px] mx-auto px-1 md:px-0">
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
              title="Keep in your private drawer"
            >
              <TrayIcon size={18} weight="bold" />
              <span className="hidden md:inline">Keep</span>
            </button>

            <div className="w-px h-4 bg-base-content/10 mx-2" />

            <button
              type="button"
              className="btn btn-primary btn-sm rounded-full px-6"
              onClick={handleSeal}
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
