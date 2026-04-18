import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockUser } from "../../test/fixtures/user.fixture";
import { useLetters } from "../hooks/useLetters";
import { useAuthStore } from "../store/useAuthStore";
import Drawer from "./Drawer";

vi.mock("../hooks/useLetters");

describe("Drawer Page", () => {
  beforeEach(() => {
    // Setup authenticated state for the test
    useAuthStore.setState({
      user: mockUser,
      accessToken: "fake-token",
      isInitializing: false,
    });

    vi.mocked(useLetters).mockReturnValue({
      drafts: [],
      kept: [],
      sent: [],
      vault: [],
      loading: false,
      isAuthRequired: false,
    });
  });

  it("renders the cabinet sections and empty state message", () => {
    render(
      <MemoryRouter>
        <Drawer />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Drafts/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Kept/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Vault/i)).toBeInTheDocument();
    expect(screen.getByText(/This drawer remains silent/i)).toBeInTheDocument();
  });

  it("renders the loading state", () => {
    vi.mocked(useLetters).mockReturnValue({
      drafts: [],
      kept: [],
      sent: [],
      vault: [],
      loading: true,
      isAuthRequired: false,
    });

    render(
      <MemoryRouter>
        <Drawer />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Opening your cabinet/i)).toBeInTheDocument();
  });

  it("renders the authentication required modal when api requires auth", () => {
    vi.mocked(useLetters).mockReturnValue({
      drafts: [],
      kept: [],
      sent: [],
      vault: [],
      loading: false,
      isAuthRequired: true,
    });

    render(
      <MemoryRouter>
        <Drawer />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Authentication Required/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });
});
