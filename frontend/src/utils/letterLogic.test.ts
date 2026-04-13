import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/apiClient";
import { CryptoUtils } from "./crypto";
import { blobUrlToFile } from "./fileUtils";
import {
  decryptCanvasImages,
  decryptCanvasImagesWithSharingKey,
  encryptCanvasImages,
} from "./letterLogic";

vi.mock("../api/apiClient", () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock("./fileUtils", () => ({
  blobUrlToFile: vi.fn(),
}));

describe("letterLogic image helpers", () => {
  let masterKey: CryptoKey;
  let crypto: CryptoUtils;

  beforeEach(async () => {
    masterKey = await CryptoUtils.deriveMasterKey(
      "password123",
      "test@example.com",
    );
    crypto = new CryptoUtils();
    await crypto.initialize();
    vi.clearAllMocks();
  });

  describe("encryptCanvasImages", () => {
    it("should not encrypt images whose src already ends with .bin", async () => {
      const canvasData = {
        objects: [
          { type: "Image", src: "already-encrypted.png.bin" },
          { type: "Textbox", text: "hello" },
        ],
      };

      const encryptImageSpy = vi.spyOn(CryptoUtils.prototype, "encryptImage");

      const uploads = await encryptCanvasImages(
        canvasData,
        [],
        masterKey,
        crypto,
      );

      expect(encryptImageSpy).not.toHaveBeenCalled();
      expect(canvasData.objects[0].src).toBe("already-encrypted.png.bin");
      expect(uploads.size).toBe(0);
    });

    it("should encrypt new blob-backed images and return encrypted uploads", async () => {
      const file = new File(["img"], "photo.png", { type: "image/png" });
      const canvasData = {
        objects: [{ type: "Image", src: "blob:http://localhost/test-image" }],
      };
      const canvasImages = [
        {
          src: "blob:http://localhost/test-image",
          file,
        },
      ];

      vi.spyOn(CryptoUtils.prototype, "encryptImage").mockResolvedValue({
        encryptedBlob: new Blob(["encrypted"], {
          type: "application/octet-stream",
        }),
        encrypted_dek: "wrapped-image-dek",
        filename: "photo.png.bin",
      });

      const uploads = await encryptCanvasImages(
        canvasData,
        canvasImages,
        masterKey,
        crypto,
      );

      expect(CryptoUtils.prototype.encryptImage).toHaveBeenCalledTimes(1);
      expect(canvasData.objects[0].src).toBe("photo.png.bin");
      expect(uploads.size).toBe(1);
      expect(uploads.has("photo.png.bin")).toBe(true);
    });
  });

  describe("decryptCanvasImages", () => {
    it("should decrypt images and replace src with blob URL", async () => {
      const canvasData = {
        version: "5.3.0",
        objects: [
          {
            type: "Image",
            src: "photo.png.bin",
            top: 0,
            left: 0,
            width: 100,
            height: 100,
          },
          {
            type: "Textbox",
            text: "hello",
            top: 0,
            left: 0,
            width: 100,
            height: 100,
          },
        ],
      };
      const remoteImages = [
        { file_name: "photo.png.bin", file: "https://remote/photo.png.bin" },
      ];

      vi.mocked(api.get).mockResolvedValue({ data: new Blob(["encrypted"]) });
      vi.spyOn(CryptoUtils.prototype, "decryptImage").mockResolvedValue(
        "blob:http://localhost/decrypted",
      );

      await decryptCanvasImages(
        canvasData,
        remoteImages,
        "wrapped-dek",
        masterKey,
        crypto,
      );

      expect(api.get).toHaveBeenCalledWith("https://remote/photo.png.bin", {
        responseType: "blob",
      });
      expect(CryptoUtils.prototype.decryptImage).toHaveBeenCalledWith(
        expect.any(Blob),
        "wrapped-dek",
        masterKey,
      );
      expect(canvasData.objects[0].src).toBe("blob:http://localhost/decrypted");
      expect(canvasData.objects[1].text).toBe("hello");
    });

    it("should include raw file when includeRawFile is true", async () => {
      const canvasData = {
        version: "5.3.0",
        objects: [
          {
            type: "Image",
            src: "photo.png.bin",
            _customRawFile: null,
            top: 0,
            left: 0,
            width: 100,
            height: 100,
          },
        ],
      };
      const remoteImages = [
        { file_name: "photo.png.bin", file: "https://remote/photo.png.bin" },
      ];

      vi.mocked(api.get).mockResolvedValue({ data: new Blob(["encrypted"]) });
      vi.spyOn(CryptoUtils.prototype, "decryptImage").mockResolvedValue(
        "blob:http://localhost/decrypted",
      );
      vi.mocked(blobUrlToFile).mockResolvedValue(
        new File(["raw"], "photo.png.bin"),
      );

      await decryptCanvasImages(
        canvasData,
        remoteImages,
        "wrapped-dek",
        masterKey,
        crypto,
        true,
      );

      expect(blobUrlToFile).toHaveBeenCalledWith(
        "blob:http://localhost/decrypted",
        "photo.png.bin",
      );
      expect(canvasData.objects[0]._customRawFile).toBeInstanceOf(File);
    });
  });

  describe("decryptCanvasImagesWithSharingKey", () => {
    it("should decrypt images using sharing key", async () => {
      const canvasData = {
        objects: [{ type: "Image", src: "photo.png.bin" }],
      };
      const remoteImages = [
        { file_name: "photo.png.bin", file: "https://remote/photo.png.bin" },
      ];

      vi.mocked(api.get).mockResolvedValue({ data: new Blob(["encrypted"]) });
      vi.spyOn(
        CryptoUtils.prototype,
        "decryptImageWithSharingKey",
      ).mockResolvedValue("blob:http://localhost/decrypted-shared");

      await decryptCanvasImagesWithSharingKey(
        canvasData,
        remoteImages,
        "raw-sharing-key",
        crypto,
      );

      expect(api.get).toHaveBeenCalledWith("https://remote/photo.png.bin", {
        responseType: "blob",
      });
      expect(
        CryptoUtils.prototype.decryptImageWithSharingKey,
      ).toHaveBeenCalledWith(expect.any(Blob), "raw-sharing-key");
      expect(canvasData.objects[0].src).toBe(
        "blob:http://localhost/decrypted-shared",
      );
    });
  });
});
