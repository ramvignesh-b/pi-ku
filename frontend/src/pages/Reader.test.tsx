import { render, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../../test/mocks/server";
import { endpoints } from "../config/endpoints";
import { CryptoUtils } from "../utils/crypto";
import Reader from "./Reader";

const API_URL = import.meta.env.VITE_API_URL;

// Spy on crypto methods so we don't have to do actual decryption in the UI test
const spyDecryptLetter = vi.spyOn(
  CryptoUtils.prototype,
  "decryptLetterWithSharingKey",
);
const spyDecryptMetadata = vi.spyOn(
  CryptoUtils.prototype,
  "decryptMetadataWithSharingKey",
);
const spyDecryptImage = vi.spyOn(
  CryptoUtils.prototype,
  "decryptImageWithSharingKey",
);

// Fabric.js needs to know when fonts are loaded
Object.defineProperty(document, "fonts", {
  value: { ready: Promise.resolve() },
  configurable: true,
});

describe("Reader Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock behavior for successful decryption
    spyDecryptLetter.mockResolvedValue('{"objects": []}');
    spyDecryptMetadata.mockResolvedValue({ recipient: "Guest" });
    spyDecryptImage.mockResolvedValue("blob:url");

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

  it("should load and decrypt the letter when a valid key is provided", async () => {
    const mockPublicId = "test-uuid";
    const mockKey = "fake-key";
    server.use(
      http.get(`${API_URL}${endpoints.LETTERS}${mockPublicId}/`, () => {
        return HttpResponse.json({
          encrypted_content: "packed-content",
          encrypted_metadata: "packed-metadata",
          images: [],
        });
      }),
    );

    render(
      <MemoryRouter initialEntries={[`/read/${mockPublicId}#${mockKey}`]}>
        <Routes>
          <Route path="/read/:public_id" element={<Reader />} />
        </Routes>
      </MemoryRouter>,
    );

    // Should show loading state first
    expect(screen.getByText(/Decrypting.../i)).toBeInTheDocument();

    expect(
      await screen.findByText(/A sealed message for/i),
    ).toBeInTheDocument();
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
