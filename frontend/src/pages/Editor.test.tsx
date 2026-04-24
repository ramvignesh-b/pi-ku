import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockMasterKey } from "../../test/fixtures/auth.fixture";
import { mockUser } from "../../test/fixtures/user.fixture";
import { server } from "../../test/mocks/server";
import { endpoints } from "../config/endpoints";
import { useAuthStore } from "../store/useAuthStore";
import { useKeyStore } from "../store/useKeyStore";
import Editor from "./Editor";

const API_URL = import.meta.env.VITE_API_URL;

// Mock ComposeCanvas to avoid Fabric.js issues and check readOnly prop
vi.mock("../components/ui/ComposeCanvas", () => ({
  ComposeCanvas: vi.fn(({ readOnly }) => (
    <div data-testid="canvas" data-readonly={readOnly}>
      Canvas
    </div>
  )),
}));

// Mock CryptoUtils to avoid real crypto calls in UI tests
vi.mock("../utils/crypto", () => {
  return {
    CryptoUtils: () => ({
      initialize: vi.fn().mockResolvedValue(undefined),
      encryptLetter: vi.fn().mockResolvedValue({
        encrypted_content: "enc-content",
        encrypted_dek: "enc-dek",
        sharingKey: "share-key",
      }),
      encryptMetadata: vi.fn().mockResolvedValue({
        encrypted_content: "enc-meta",
        encrypted_dek: "enc-dek",
      }),
      decryptMetadata: vi.fn().mockResolvedValue({ recipient: "Test User" }),
      decryptLetter: vi.fn().mockResolvedValue("{}"),
      extractSharingKey: vi.fn().mockResolvedValue("share-key"),
    }),
  };
});

describe("Editor Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: mockUser,
      accessToken: "fake-token",
      isInitializing: false,
    });
    useKeyStore.setState({ masterKey: mockMasterKey });
  });

  it("should set canvas to readOnly when status is VAULT", async () => {
    server.use(
      http.get(`${API_URL}${endpoints.LETTERS}:id/`, () => {
        return HttpResponse.json({
          public_id: "test-id",
          status: "DRAFT",
          updated_at: new Date().toISOString(),
          encrypted_content: "{}",
          encrypted_metadata: "{}",
          encrypted_dek: "wrapped-dek",
        });
      }),
      http.put(`${API_URL}${endpoints.LETTERS}:id/`, () => {
        return HttpResponse.json({ status: "success" });
      }),
    );

    const { container } = render(
      <MemoryRouter initialEntries={["/write/test-id"]}>
        <Routes>
          <Route path="/write/:public_id" element={<Editor />} />
        </Routes>
      </MemoryRouter>,
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.queryByText(/Opening your draft/i)).not.toBeInTheDocument();
    });

    // Initial state: DRAFT (not read-only)
    const canvas = screen.getByTestId("canvas");
    expect(canvas.getAttribute("data-readonly")).toBe("false");

    // Click Seal in the main toolbar (it's in the div with id="writer-toolbar")
    const toolbar = container.querySelector("#writer-toolbar");
    const sealBtn = toolbar?.querySelector(".btn-primary");
    if (!sealBtn) throw new Error("Seal button not found");
    fireEvent.click(sealBtn);

    // Click Vault to show confirm modal
    const vaultBtn = screen.getByRole("button", { name: /vault/i });
    fireEvent.click(vaultBtn);

    // Set date and submit vault form
    const dateInput = container.querySelector('input[name="vault-date"]');
    if (!dateInput) throw new Error("Date input not found");
    fireEvent.change(dateInput, { target: { value: "2026-12-31" } });

    const confirmVaultBtn = container.querySelector(
      'button[form="vault-form"]',
    );
    if (!confirmVaultBtn) throw new Error("Confirm vault button not found");
    fireEvent.click(confirmVaultBtn);

    // Wait for save to complete and check readOnly
    await waitFor(() => {
      expect(screen.getByText(/Your letter is saved/i)).toBeInTheDocument();
    });

    expect(canvas.getAttribute("data-readonly")).toBe("true");
    expect(screen.getByLabelText(/recipient/i)).toBeDisabled();
  });

  it("should set canvas to readOnly when status is SEALED", async () => {
    server.use(
      http.get(`${API_URL}${endpoints.LETTERS}:id/`, () => {
        return HttpResponse.json({
          public_id: "test-id",
          status: "DRAFT",
          updated_at: new Date().toISOString(),
          encrypted_content: "{}",
          encrypted_metadata: "{}",
          encrypted_dek: "wrapped-dek",
        });
      }),
      http.put(`${API_URL}${endpoints.LETTERS}:id/`, () => {
        return HttpResponse.json({ status: "success" });
      }),
    );

    const { container } = render(
      <MemoryRouter initialEntries={["/write/test-id"]}>
        <Routes>
          <Route path="/write/:public_id" element={<Editor />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByText(/Opening your draft/i)).not.toBeInTheDocument();
    });

    const canvas = screen.getByTestId("canvas");

    const toolbar = container.querySelector("#writer-toolbar");
    const sealBtn = toolbar?.querySelector(".btn-primary");
    if (!sealBtn) throw new Error("Seal button not found");
    fireEvent.click(sealBtn);

    // The secondary seal button appears (it has btn-accent class)
    const secondarySealBtn = container.querySelector(".btn-accent");
    if (!secondarySealBtn) throw new Error("Secondary seal button not found");
    fireEvent.click(secondarySealBtn);

    await waitFor(() => {
      expect(screen.getByText(/Your letter is saved/i)).toBeInTheDocument();
    });

    expect(canvas.getAttribute("data-readonly")).toBe("true");
    expect(screen.getByLabelText(/recipient/i)).toBeDisabled();
  });
});
