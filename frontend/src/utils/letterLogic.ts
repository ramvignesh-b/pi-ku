import { api, apiServerUrl, publicApi } from "../api/apiClient";
import type { LetterImageData } from "../api/response";
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

export interface DecryptedFabricImageJSON extends FabricImageJSON {
  _customRawFile?: File;
}

export interface DecryptionResult {
  canvasDataWithDecryptedImages: CanvasJSON;
  isPartialFailure: boolean;
  errors: string[];
}

export interface EncryptionResult {
  encryptedImageFiles: Map<string, Blob>;
  encryptedCanvasData: CanvasJSON;
}

async function fetchEncryptedBlobFromRemote(remoteUrl: string): Promise<Blob> {
  // IF served statically from server, we need proper CORS setup
  if (remoteUrl.includes(apiServerUrl)) {
    const res = await api.get(remoteUrl, { responseType: "blob" });
    return res.data;
  }
  // Note: S3 Storage fetch (external url) has to bypass our existing CORS setup
  const res = await publicApi.get(remoteUrl, {
    responseType: "blob",
    withCredentials: false,
  });
  return res.data;
}

export async function decryptCanvasImages(
  canvasData: CanvasJSON,
  remoteImages: { file_name: string; file: string }[],
  encrypted_dek: string,
  masterKey: CryptoKey,
  cryptoUtils: CryptoUtils,
  includeRawFile = false,
): Promise<DecryptionResult> {
  if (!canvasData?.objects) {
    return {
      canvasDataWithDecryptedImages: canvasData,
      isPartialFailure: false,
      errors: [],
    };
  }

  const imageMap = new Map(
    remoteImages.map((img) => [img.file_name, img.file]),
  );

  const errors: string[] = [];
  const processedObjects = await Promise.all(
    canvasData.objects.map(async (obj) => {
      if (obj.type !== "Image") return obj;

      const imgObj = obj as FabricImageJSON;
      const remoteUrl = imageMap.get(imgObj.src);
      if (!remoteUrl) return obj;

      try {
        const blob = await fetchEncryptedBlobFromRemote(remoteUrl);
        const blobUrl = await cryptoUtils.decryptImage(
          blob,
          encrypted_dek,
          masterKey,
        );

        const decryptedObj: DecryptedFabricImageJSON = {
          ...imgObj,
          src: blobUrl,
        };

        if (includeRawFile) {
          decryptedObj._customRawFile = await blobUrlToFile(
            blobUrl,
            imgObj.src,
          );
        }

        return decryptedObj;
      } catch (err) {
        errors.push(
          `Failed to decrypt ${imgObj.src}: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
        return null;
      }
    }),
  );

  return {
    canvasDataWithDecryptedImages: {
      ...canvasData,
      objects: processedObjects.filter((obj) => !!obj),
    },
    isPartialFailure: errors.length > 0,
    errors,
  };
}

export async function decryptCanvasImagesWithSharingKey(
  canvasData: CanvasJSON,
  remoteImages: LetterImageData[],
  sharingKey: string,
  cryptoUtils: CryptoUtils,
): Promise<DecryptionResult> {
  if (!canvasData?.objects) {
    return {
      canvasDataWithDecryptedImages: canvasData,
      isPartialFailure: false,
      errors: [],
    };
  }

  const imageMap = new Map(
    remoteImages.map((img) => [img.file_name, img.file]),
  );
  const errors: string[] = [];

  const processedObjects = await Promise.all(
    canvasData.objects.map(async (obj) => {
      if (obj.type !== "Image") return obj;

      const imgObj = obj as FabricImageJSON;
      const remoteUrl = imageMap.get(imgObj.src);
      if (!remoteUrl) return obj;

      try {
        const blob = await fetchEncryptedBlobFromRemote(remoteUrl);
        const blobUrl = await cryptoUtils.decryptImageWithSharingKey(
          blob,
          sharingKey,
        );

        return { ...imgObj, src: blobUrl };
      } catch (err) {
        errors.push(
          `Failed to decrypt ${imgObj.src}: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
        return null;
      }
    }),
  );

  return {
    canvasDataWithDecryptedImages: {
      ...canvasData,
      objects: processedObjects.filter((obj) => !!obj),
    },
    isPartialFailure: errors.length > 0,
    errors,
  };
}

export async function encryptCanvasImages(
  canvasData: CanvasJSON,
  canvasImages: CanvasImageRef[],
  masterKey: CryptoKey,
  cryptoUtils: CryptoUtils,
): Promise<EncryptionResult> {
  const encryptedImageFiles = new Map<string, Blob>();
  const filenameMapping = new Map<string, string>();

  // filter out already encrypted images
  const imagesToEncrypt = canvasImages.filter(
    (img) => img.file && !img.src.endsWith(".bin"),
  );

  // encrypt images parallelly
  await Promise.all(
    imagesToEncrypt.map(async (img) => {
      const { filename, encryptedBlob } = await cryptoUtils.encryptImage(
        img.file,
        masterKey,
      );
      // map the og image url to the encrypted file name and filename to the encrypted source
      filenameMapping.set(img.src, filename);
      encryptedImageFiles.set(filename, encryptedBlob);
    }),
  );

  if (!canvasData?.objects)
    return { encryptedImageFiles, encryptedCanvasData: canvasData };

  const newCanvasData = {
    ...canvasData,
    objects: canvasData.objects.map((obj) => {
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
    }),
  };

  return { encryptedImageFiles, encryptedCanvasData: newCanvasData };
}
