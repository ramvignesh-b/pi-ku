import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { server } from "../../test/mocks/server";
import { endpoints } from "../config/endpoints";
import { useKeyStore } from "../store/useKeyStore";
import { CryptoUtils } from "../utils/crypto";
import { useLetters } from "./useLetters";

describe("useLetters hook", () => {
  let masterKey: CryptoKey;
  let utils: CryptoUtils;

  beforeEach(async () => {
    utils = new CryptoUtils();
    await utils.initialize();
    const bundle = await CryptoUtils.deriveKeyBundle("password", "salt");
    masterKey = bundle.masterKey;

    useKeyStore.setState({ masterKey: null });
  });

  it("should indicate authentication is required when masterKey is missing", () => {
    const { result } = renderHook(() => useLetters());

    expect(result.current.isAuthRequired).toBe(true);
  });

  it("should fetch, decrypt, and categorize letters when masterKey is present", async () => {
    useKeyStore.setState({ masterKey });

    const draftPayload = { objects: [] };
    const encryptedDraft = await utils.encryptMetadata(
      { recipient: "Draft Recipient" },
      masterKey,
    );

    const lettersResponse = [
      {
        public_id: "letter-1",
        type: "KEPT",
        status: "DRAFT",
        updated_at: new Date().toISOString(),
        encrypted_metadata: encryptedDraft.encrypted_content,
        encrypted_content: JSON.stringify(draftPayload),
        encrypted_dek: encryptedDraft.encrypted_dek,
      },
    ];

    server.use(
      http.get(`${import.meta.env.VITE_API_URL}${endpoints.LETTERS}`, () => {
        return HttpResponse.json(lettersResponse);
      }),
    );

    const { result } = renderHook(() => useLetters());

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.drafts).toHaveLength(1);
    expect(result.current.drafts[0].metadata.recipient).toBe("Draft Recipient");
    expect(result.current.kept).toHaveLength(0);
  });

  it("should sort letters by updated_at in descending order", async () => {
    useKeyStore.setState({ masterKey });

    const metadata = await utils.encryptMetadata(
      { recipient: "test" },
      masterKey,
    );

    const now = new Date();
    const older = new Date(now.getTime() - 10000);

    const lettersResponse = [
      {
        public_id: "older",
        type: "KEPT",
        status: "SEALED",
        updated_at: older.toISOString(),
        encrypted_metadata: metadata.encrypted_content,
        encrypted_content: "{}",
        encrypted_dek: metadata.encrypted_dek,
      },
      {
        public_id: "newer",
        type: "KEPT",
        status: "SEALED",
        updated_at: now.toISOString(),
        encrypted_metadata: metadata.encrypted_content,
        encrypted_content: "{}",
        encrypted_dek: metadata.encrypted_dek,
      },
    ];

    server.use(
      http.get(`${import.meta.env.VITE_API_URL}${endpoints.LETTERS}`, () => {
        return HttpResponse.json(lettersResponse);
      }),
    );

    const { result } = renderHook(() => useLetters());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.kept[0].public_id).toBe("newer");
    expect(result.current.kept[1].public_id).toBe("older");
  });
});
