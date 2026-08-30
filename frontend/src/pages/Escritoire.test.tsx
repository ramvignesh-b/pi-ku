import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockUser } from "../../test/fixtures/user.fixture";
import type { WelcomeLetterOverlayProps } from "../components/escritoire/WelcomeLetterOverlay";
import { useLetters } from "../hooks/useLetters";
import { useAuthStore } from "../store/useAuthStore";
import Escritoire from "./Escritoire";

vi.mock("../hooks/useLetters");
vi.mock("../components/escritoire/WelcomeLetterOverlay", () => ({
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

  it("renders the drawer sections and empty state message", () => {
    render(
      <MemoryRouter>
        <Escritoire />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("drawer-section-drafts")).toBeInTheDocument();
    expect(
      screen.getAllByTestId("drawer-section-title").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("drawer-section-vault")).toBeInTheDocument();
    expect(
      screen.getByTestId("empty-drawer-message-drafts"),
    ).toBeInTheDocument();
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
        <Escritoire />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("escritoire-loading-state")).toBeInTheDocument();
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
        <Escritoire />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("unlock-modal-title")).toBeInTheDocument();
    expect(screen.getByTestId("unlock-input")).toBeInTheDocument();
  });

  it("renders the welcome letter when firstTime state is present", () => {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/escritoire", state: { firstTime: true } },
        ]}
      >
        <Escritoire />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("welcome-letter-overlay")).toBeInTheDocument();
  });

  it("renders the drawer content when the letter is closed", () => {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/escritoire", state: { firstTime: true } },
        ]}
      >
        <Escritoire />
      </MemoryRouter>,
    );

    const completeButton = screen.getByTestId("overlay-exit-button");
    fireEvent.click(completeButton);

    expect(
      screen.queryByTestId("welcome-letter-overlay"),
    ).not.toBeInTheDocument();
  });

  it("toggles the definition card when clicking the definition toggle button", async () => {
    render(
      <MemoryRouter>
        <Escritoire />
      </MemoryRouter>,
    );

    expect(
      screen.queryByTestId("escritoire-definition-card"),
    ).not.toBeInTheDocument();

    const toggleBtn = screen.getByTestId("escritoire-definition-toggle");
    fireEvent.click(toggleBtn);

    expect(
      screen.getByTestId("escritoire-definition-card"),
    ).toBeInTheDocument();
    expect(screen.getByText("es·cri·toire")).toBeInTheDocument();
    expect(
      screen.getByText(/a writing desk with small drawers/i),
    ).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: /close definition/i });
    fireEvent.click(closeBtn);

    await waitForElementToBeRemoved(() =>
      screen.queryByTestId("escritoire-definition-card"),
    );
  });

  it("does not close definition card when clicking outside, and collapses when clicking the word again", async () => {
    render(
      <MemoryRouter>
        <Escritoire />
      </MemoryRouter>,
    );

    const toggleBtn = screen.getByTestId("escritoire-definition-toggle");
    fireEvent.click(toggleBtn);

    expect(
      screen.getByTestId("escritoire-definition-card"),
    ).toBeInTheDocument();

    // Clicking outside should NOT close the card
    fireEvent.mouseDown(document.body);
    expect(
      screen.getByTestId("escritoire-definition-card"),
    ).toBeInTheDocument();

    // Clicking the word toggle again collapses it
    fireEvent.click(toggleBtn);
    await waitForElementToBeRemoved(() =>
      screen.queryByTestId("escritoire-definition-card"),
    );
  });
});
