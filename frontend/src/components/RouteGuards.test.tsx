import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { mockUser } from "../../test/fixtures/user.fixture";
import { useAuthStore } from "../store/useAuthStore";
import { ProtectedRoute, PublicRoute } from "./RouteGuards";

function renderGuard(ui: React.ReactNode, mountPath: "/protected" | "/public") {
  return render(
    <MemoryRouter initialEntries={[mountPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/drawer" element={<div>Drawer Page</div>} />
        <Route path="/protected" element={ui} />
        <Route path="/public" element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthStore.setState({
    accessToken: null,
    user: null,
    isInitializing: true,
  });
});

describe("ProtectedRoute", () => {
  it("should show SplashScreen while auth is initializing", () => {
    useAuthStore.setState({
      isInitializing: true,
      accessToken: null,
      user: null,
    });
    renderGuard(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>,
      "/protected",
    );

    expect(screen.getByText(/Unsealing/i)).toBeInTheDocument();
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("should redirect unauthenticated users to /login", () => {
    useAuthStore.setState({
      isInitializing: false,
      accessToken: null,
      user: null,
    });
    renderGuard(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>,
      "/protected",
    );
    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("should render page for authenticated users", () => {
    useAuthStore.setState({
      isInitializing: false,
      accessToken: "token",
      user: mockUser,
    });
    renderGuard(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>,
      "/protected",
    );

    expect(screen.getByText("Secret")).toBeInTheDocument();
  });
});

describe("PublicRoute", () => {
  it("should show SplashScreen while auth is initializing", () => {
    useAuthStore.setState({
      isInitializing: true,
      accessToken: null,
      user: null,
    });
    renderGuard(
      <PublicRoute>
        <div>Login Page</div>
      </PublicRoute>,
      "/public",
    );
    expect(screen.getByText(/Unsealing/i)).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("should redirect authenticated users to /drawer", () => {
    useAuthStore.setState({
      isInitializing: false,
      accessToken: "token",
      user: mockUser,
    });
    renderGuard(
      <PublicRoute>
        <div>Login Form</div>
      </PublicRoute>,
      "/public",
    );
    expect(screen.getByText("Drawer Page")).toBeInTheDocument();
    expect(screen.queryByText("Login Form")).not.toBeInTheDocument();
  });

  it("should render page for unauthenticated users", () => {
    useAuthStore.setState({
      isInitializing: false,
      accessToken: null,
      user: null,
    });
    renderGuard(
      <PublicRoute>
        <div>Login Form</div>
      </PublicRoute>,
      "/public",
    );
    expect(screen.getByText("Login Form")).toBeInTheDocument();
  });
});
