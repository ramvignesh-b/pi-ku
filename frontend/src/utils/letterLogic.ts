import { api } from "../api/apiClient";
import type {
  CanvasJSON,
  FabricImageJSON,
} from "../components/editor/ComposeCanvas";
import type { CryptoUtils } from "./crypto";
import { blobUrlToFile } from "./fileUtils";

export interface CanvasImageRef {
  src: string;
  file: File;
}

export async function decryptCanvasImages(
  canvasData: CanvasJSON,
  remoteImages: { file_name: string; file: string }[],
  encrypted_dek: string,
  masterKey: CryptoKey,
  cryptoUtils: CryptoUtils,
  includeRawFile = false,
): Promise<{ isDecryptionPartialFailure: boolean; error: string }> {
  if (!canvasData?.objects)
    return { isDecryptionPartialFailure: false, error: "" };
  let isDecryptionPartialFailure = false;
  let error = "";

  const imageMap = new Map(
    remoteImages.map((img) => [img.file_name, img.file]),
  );

  const imageDecryptionPromises = canvasData.objects.map(async (obj, index) => {
    if (obj.type !== "Image") return;
    const imgObj = obj as FabricImageJSON;
    const remoteUrl = imageMap.get(imgObj.src);
    if (!remoteUrl) return;

    try {
      // HACK: For S3 Storage fetch and avoiding CORS error
      const res = await api.get(remoteUrl, {
        responseType: "blob",
        withCredentials: false,
      });
      const originalSrc = imgObj.src;

      const blobUrl = await cryptoUtils.decryptImage(
        res.data,
        encrypted_dek,
        masterKey,
      );

      imgObj.src = blobUrl;

      if (includeRawFile) {
        imgObj._customRawFile = await blobUrlToFile(blobUrl, originalSrc);
      }
    } catch (_error) {
      delete canvasData.objects[index];
      isDecryptionPartialFailure = true;
      error = _error instanceof Error ? _error.message : "Unknown error";
    }
  });

  await Promise.all(imageDecryptionPromises);
  canvasData.objects = canvasData.objects.filter(Boolean);
  return { isDecryptionPartialFailure, error };
}

export async function decryptCanvasImagesWithSharingKey(
  canvasData: CanvasJSON,
  remoteImages: { file_name: string; file: string }[],
  sharingKey: string,
  cryptoUtils: CryptoUtils,
): Promise<{ isDecryptionPartialFailure: boolean; error: string }> {
  if (!canvasData?.objects)
    return { isDecryptionPartialFailure: false, error: "" };
  let isDecryptionPartialFailure = false;
  let error = "";
  const imageMap = new Map(
    remoteImages.map((img) => [img.file_name, img.file]),
  );

  const decryptionPromises = canvasData.objects.map(async (obj, index) => {
    if (obj.type !== "Image") return;

    const imgObj = obj as FabricImageJSON;
    const remoteUrl = imageMap.get(imgObj.src);
    if (!remoteUrl) return;

    try {
      const res = await api.get(remoteUrl, {
        responseType: "blob",
        withCredentials: false,
      });
      imgObj.src = await cryptoUtils.decryptImageWithSharingKey(
        res.data,
        sharingKey,
      );
    } catch (_error) {
      delete canvasData.objects[index];
      isDecryptionPartialFailure = true;
      error = _error instanceof Error ? _error.message : "Unknown error";
    }
  });

  await Promise.all(decryptionPromises);
  canvasData.objects = canvasData.objects.filter(Boolean);
  return { isDecryptionPartialFailure, error };
}

export async function encryptCanvasImages(
  canvasData: CanvasJSON,
  canvasImages: CanvasImageRef[],
  masterKey: CryptoKey,
  cryptoUtils: CryptoUtils,
) {
  const encryptedFiles = new Map<string, Blob>();
  const filenameMapping = new Map<string, string>();

  for (const img of canvasImages) {
    if (img.src.endsWith(".bin")) continue;
    if (!img.file) continue;
    const { filename, encryptedBlob } = await cryptoUtils.encryptImage(
      img.file,
      masterKey,
    );
    filenameMapping.set(img.src, filename);
    encryptedFiles.set(filename, encryptedBlob);
  }

  if (canvasData?.objects) {
    canvasData.objects = canvasData.objects.map((obj) => {
      if (obj.type === "Image") {
        const imgObj = obj as FabricImageJSON;
        if (filenameMapping.has(imgObj.src)) {
          return {
            ...imgObj,
            src: filenameMapping.get(imgObj.src) as string,
          };
        }
      }
      return obj;
    });
  }

  return encryptedFiles;
}
