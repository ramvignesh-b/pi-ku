import { api } from "../api/apiClient";
import type { CryptoUtils } from "./crypto";
import { blobUrlToFile } from "./fileUtils";

export interface CanvasImageRef {
  src: string;
  file: File;
}

export async function decryptCanvasImages(
  canvasData: any,
  remoteImages: any[],
  encrypted_dek: string,
  masterKey: CryptoKey,
  cryptoUtils: CryptoUtils,
  includeRawFile = false,
) {
  if (!canvasData?.objects) return;

  const imageMap = new Map(
    remoteImages.map((img) => [img.file_name, img.file]),
  );

  for (const obj of canvasData.objects) {
    if (obj.type !== "Image") continue;

    const originalFilename = obj.src;
    const remoteUrl = imageMap.get(originalFilename);
    if (!remoteUrl) continue;

    const res = await api.get(remoteUrl, { responseType: "blob" });
    const blobUrl = await cryptoUtils.decryptImage(
      res.data,
      encrypted_dek,
      masterKey,
    );

    obj.src = blobUrl;

    if (includeRawFile) {
      obj._customRawFile = await blobUrlToFile(blobUrl, originalFilename);
    }
  }
}

export async function decryptCanvasImagesWithSharingKey(
  canvasData: any,
  remoteImages: any[],
  sharingKey: string,
  cryptoUtils: CryptoUtils,
) {
  if (!canvasData?.objects) return;

  const imageMap = new Map(
    remoteImages.map((img) => [img.file_name, img.file]),
  );

  for (const obj of canvasData.objects) {
    if (obj.type !== "Image") continue;

    const remoteUrl = imageMap.get(obj.src);
    if (!remoteUrl) continue;

    const res = await api.get(remoteUrl, { responseType: "blob" });
    obj.src = await cryptoUtils.decryptImageWithSharingKey(
      res.data,
      sharingKey,
    );
  }
}

export async function encryptCanvasImages(
  canvasData: any,
  canvasImages: CanvasImageRef[],
  masterKey: CryptoKey,
  cryptoUtils: CryptoUtils,
) {
  const encryptedFiles = new Map<string, Blob>();
  const filenameMapping = new Map<string, string>();

  for (const img of canvasImages) {
    if (img.src.endsWith(".bin")) continue;
    if (!img.file) continue;

    try {
      const { filename, encryptedBlob } = await cryptoUtils.encryptImage(
        img.file,
        masterKey,
      );
      filenameMapping.set(img.src, filename);
      encryptedFiles.set(filename, encryptedBlob);
    } catch (_err) {}
  }

  if (canvasData?.objects) {
    canvasData.objects = canvasData.objects.map((obj: any) => {
      if (obj.type === "Image" && filenameMapping.has(obj.src)) {
        return { ...obj, src: filenameMapping.get(obj.src) };
      }
      return obj;
    });
  }

  return encryptedFiles;
}
