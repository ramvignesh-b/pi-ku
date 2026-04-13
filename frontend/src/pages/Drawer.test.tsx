import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { mockUser } from "../../test/fixtures/user.fixture";
import { useAuthStore } from "../store/useAuthStore";
import Drawer from "./Drawer";

describe("Drawer Page", () => {
  beforeEach(() => {
    // Setup authenticated state for the test
    useAuthStore.setState({
      user: mockUser,
      accessToken: "fake-token",
      isInitializing: false,
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
});
