import { render, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../../test/mocks/server";
import { endpoints } from "../config/endpoints";
import { useKeyStore } from "../store/useKeyStore";
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

  const LocationTest = () => {
    const location = useLocation();
    return (
      <div data-testid="location-state">
        {JSON.stringify(location.state || {})}
      </div>
    );
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    utils = new CryptoUtils();
    await utils.initialize();
    const bundle = await CryptoUtils.deriveKeyBundle("password", "salt");
    masterKey = bundle.masterKey;
    // User is logged in by default
    useKeyStore.setState({ masterKey });

    // Clear the URL hash
    vi.stubGlobal("location", {
      hash: "",
      href: "http://localhost/",
    });
  });

  it("should load and decrypt the letter when a valid key is provided and display the envelope", async () => {
    const mockPublicId = "test-uuid";
    const letterContent = JSON.stringify({ objects: [] });
    const metadata = { recipient: "Guest" };
    // simulate guest
    useKeyStore.setState({ masterKey: null });

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
    expect(await screen.findByTestId("envelope-recipient")).toHaveTextContent(/Guest/i);
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
      await screen.findByTestId("log-modal-message"),
    ).toHaveTextContent(/Failed to load letter/i);
  });

  it("should navigate to the login page with redirect url when the letter has no sharing key and the user is not logged in", async () => {
    const mockPublicId = "4ef9f25f-4f37-477a-891a-4b10541e350c";
    const letterContent = JSON.stringify({ objects: [] });
    const metadata = { recipient: "Guest" };
    useKeyStore.setState({ masterKey: null });

    const encryptedLetter = await utils.encryptLetter(letterContent, masterKey);
    const encryptedMetadata = await utils.encryptMetadata(metadata, masterKey);

    server.use(
      http.get(`${API_URL}${endpoints.LETTERS}${mockPublicId}/`, () => {
        return HttpResponse.json({
          encrypted_content: encryptedLetter.encrypted_content,
          encrypted_metadata: encryptedMetadata.encrypted_content,
          encrypted_dek: encryptedLetter.encrypted_dek,
          images: [],
        });
      }),
    );

    render(
      <MemoryRouter initialEntries={[`/read/${mockPublicId}`]}>
        <Routes>
          <Route path="/read/:public_id" element={<Reader />} />
          <Route path="/login" element={<LocationTest />} />
        </Routes>
      </MemoryRouter>,
    );

    const stateComponent = screen.getByTestId("location-state");
    expect(stateComponent).toHaveTextContent(
      `"redirectUrl":"/read/${mockPublicId}"`,
    );
  });
});
