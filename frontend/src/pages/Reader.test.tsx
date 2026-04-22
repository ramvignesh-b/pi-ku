import { render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../../test/mocks/server";
import { endpoints } from "../config/endpoints";
import { CryptoUtils } from "../utils/crypto";
import Reader from "./Reader";

const API_URL = import.meta.env.VITE_API_URL;

// Fabric.js needs to know when fonts are loaded
Object.defineProperty(document, "fonts", {
  value: { ready: Promise.resolve() },
  configurable: true,
});

describe("Reader Page", () => {
  let masterKey: CryptoKey;
  let utils: CryptoUtils;

  beforeEach(async () => {
    vi.clearAllMocks();

    utils = new CryptoUtils();
    await utils.initialize();
    const bundle = await CryptoUtils.deriveKeyBundle("password", "salt");
    masterKey = bundle.masterKey;

    // Clear the URL hash
    vi.stubGlobal("location", {
      hash: "",
      href: "http://localhost/",
    });
  });

  it("should notify the user if the sharing key is missing from the URL", async () => {
    render(
      <MemoryRouter initialEntries={["/read/123"]}>
        <Routes>
          <Route path="/read/:public_id" element={<Reader />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/No sharing key provided/i),
    ).toBeInTheDocument();
  });

  it("should load and decrypt the letter when a valid key is provided and display the envelope", async () => {
    const mockPublicId = "test-uuid";
    const letterContent = JSON.stringify({ objects: [] });
    const metadata = { recipient: "Guest" };

    const encryptedLetter = await utils.encryptLetter(letterContent, masterKey);
    const encryptedMetadata = await utils.encryptMetadata(metadata, masterKey);

    const sharingKey = encryptedLetter.sharingKey as string;

    server.use(
      http.get(`${API_URL}${endpoints.LETTERS}${mockPublicId}/`, () => {
        return HttpResponse.json({
          encrypted_content: encryptedLetter.encrypted_content,
          encrypted_metadata: encryptedMetadata.encrypted_content, // Reader expects .encrypted_content for metadata too
          encrypted_dek: encryptedLetter.encrypted_dek,
          images: [],
        });
      }),
    );

    render(
      <MemoryRouter initialEntries={[`/read/${mockPublicId}#${sharingKey}`]}>
        <Routes>
          <Route path="/read/:public_id" element={<Reader />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText(/Guest/i)).toBeInTheDocument();
    });
  });

  it("should display an error message if the server request fails", async () => {
    const mockPublicId = "fail-uuid";
    const mockKey = "some-key";

    server.use(
      http.get(`${API_URL}${endpoints.LETTERS}${mockPublicId}/`, () => {
        return new HttpResponse(null, { status: 404 });
      }),
    );

    render(
      <MemoryRouter initialEntries={[`/read/${mockPublicId}#${mockKey}`]}>
        <Routes>
          <Route path="/read/:public_id" element={<Reader />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/Failed to load letter/i),
    ).toBeInTheDocument();
  });
});
