import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { server } from "../../test/mocks/server";
import { endpoints } from "../config/endpoints";
import Login from "./Login";

const API_URL = import.meta.env.VITE_API_URL;

describe("Login Page", () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it("should display a technical issues message when the server is down", async () => {
    server.use(
      http.post(`${API_URL}${endpoints.LOGIN}`, () =>
        HttpResponse.json({ detail: "Internal Server Error" }, { status: 500 }),
      ),
    );

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByTestId("login-error-message")).toHaveTextContent(
      /technical issues/i,
    );
  });

  it.each([
    {
      locationState: undefined,
      nextRoute: "Drawer",
    },
    {
      locationState: { redirectUrl: "/read/123" },
      nextRoute: "Reader",
    },
  ])("should redirect to the next route when login is successful", async ({
    locationState,
    nextRoute,
  }) => {
    const mockUser = {
      public_id: "user-123",
      email: "test@example.com",
      full_name: "Test User",
    };

    server.use(
      http.post(`${API_URL}${endpoints.LOGIN}`, () =>
        HttpResponse.json({ access: "fake-token" }),
      ),
    );
    server.use(
      http.get(`${API_URL}${endpoints.ME}`, () => HttpResponse.json(mockUser)),
    );

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/login",
            state: locationState,
          },
        ]}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/drawer"
            element={<div data-testid="drawer-page">Drawer</div>}
          />
          <Route
            path="/read/:publicId"
            element={<div data-testid="reader-page">Reader</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    const expectedTestId =
      nextRoute.toLowerCase() === "drawer" ? "drawer-page" : "reader-page";
    expect(await screen.findByTestId(expectedTestId)).toBeInTheDocument();
  });
});
