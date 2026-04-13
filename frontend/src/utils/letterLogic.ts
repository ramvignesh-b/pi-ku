import { api } from "../api/apiClient";
import { CryptoUtils } from "./crypto";
import { blobUrlToFile } from "./fileUtils";

// Helpers to handle the complex process of locking and unlocking letters with images.

const crypto = new CryptoUtils();

// Goes through the canvas objects and decrypts any images found.
// This is used when opening an existing letter.
export async function decryptCanvasImages(
  canvasData: any,
  remoteImages: any[],
  encrypted_dek: string,
  masterKey: CryptoKey,
  includeRawFile = false,
) {
  if (!canvasData?.objects) return;

  const imageMap = new Map(
    remoteImages.map((img) => [img.file_name, img.file]),
  );

  for (const obj of canvasData.objects) {
    if (obj.type === "Image" && typeof obj.src === "string") {
      const remoteUrl = imageMap.get(obj.src);
      if (!remoteUrl) continue;

      try {
        const res = await api.get(remoteUrl, { responseType: "blob" });
        const blobUrl = await crypto.decryptImage(
          res.data,
          encrypted_dek,
          masterKey,
        );

        obj.src = blobUrl;
        if (includeRawFile) {
          // We need the raw file in the editor so we can re-encrypt it if the user saves again.
          obj._customRawFile = await blobUrlToFile(blobUrl, obj.src);
        }
      } catch (err) {
        console.error("Error decrypting image in canvas:", obj.src, err);
      }
    }
  }
}

// Decrypts canvas images using just the sharing key (for guest access).
export async function decryptCanvasImagesWithSharingKey(
  canvasData: any,
  remoteImages: any[],
  sharingKey: string,
) {
  if (!canvasData?.objects) return;

  const imageMap = new Map(
    remoteImages.map((img) => [img.file_name, img.file]),
  );

  for (const obj of canvasData.objects) {
    if (obj.type === "Image" && typeof obj.src === "string") {
      const remoteUrl = imageMap.get(obj.src);
      if (!remoteUrl) continue;

      try {
        const res = await api.get(remoteUrl, { responseType: "blob" });
        obj.src = await crypto.decryptImageWithSharingKey(res.data, sharingKey);
      } catch (err) {
        console.error("Guest decryption failed for canvas image:", err);
      }
    }
  }
}

// Encrypts any new images the user added to the canvas.
// Returns a map of filenames to encrypted blobs for uploading.
export async function encryptCanvasImages(
  canvasData: any,
  canvasImages: { src: string; file: File }[],
  masterKey: CryptoKey,
) {
  const encryptedFiles = new Map<string, Blob>();
  const filenameMapping = new Map<string, string>();

  await crypto.initialize();

  for (const img of canvasImages) {
    // If it already ends in .bin, it was already encrypted.
    if (img.src.endsWith(".bin")) continue;

    try {
      const { filename, encryptedBlob } = await crypto.encryptImage(
        img.file,
        masterKey,
      );
      filenameMapping.set(img.src, filename);
      encryptedFiles.set(filename, encryptedBlob);
    } catch (err) {
      console.error("Failed to encrypt new canvas image:", err);
    }
  }

  // Update the canvas JSON to use the new encrypted filenames instead of blob URLs.
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
