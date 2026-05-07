import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockUser } from "../../test/fixtures/user.fixture";
import type { WelcomeLetterOverlayProps } from "../components/drawer/WelcomeLetterOverlay";
import { useLetters } from "../hooks/useLetters";
import { useAuthStore } from "../store/useAuthStore";
import Drawer from "./Drawer";

vi.mock("../hooks/useLetters");
vi.mock("../components/drawer/WelcomeLetterOverlay", () => ({
  WelcomeLetterOverlay: ({ onComplete }: WelcomeLetterOverlayProps) => (
    <div data-testid="welcome-letter-overlay">
      <button
        type="button"
        data-testid="overlay-exit-button"
        onClick={onComplete}
      >
        I'll see you
      </button>
    </div>
  ),
}));

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

    expect(screen.getByTestId("drawer-section-drafts")).toBeInTheDocument();
    expect(screen.getAllByTestId("drawer-section-title").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("drawer-section-vault")).toBeInTheDocument();
    expect(screen.getByTestId("empty-drawer-message-drafts")).toBeInTheDocument();
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

    expect(screen.getByTestId("drawer-loading-state")).toBeInTheDocument();
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

    expect(screen.getByTestId("passkey-modal-title")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it("renders the welcome letter when firstTime state is present", () => {
    render(
      <MemoryRouter
        initialEntries={[{ pathname: "/drawer", state: { firstTime: true } }]}
      >
        <Drawer />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("welcome-letter-overlay")).toBeInTheDocument();
  });

  it("renders the drawer content when the letter is closed", () => {
    render(
      <MemoryRouter
        initialEntries={[{ pathname: "/drawer", state: { firstTime: true } }]}
      >
        <Drawer />
      </MemoryRouter>,
    );

    const completeButton = screen.getByTestId("overlay-exit-button");
    fireEvent.click(completeButton);

    expect(
      screen.queryByTestId("welcome-letter-overlay"),
    ).not.toBeInTheDocument();
  });
});
