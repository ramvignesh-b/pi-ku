import { HttpResponse, http } from "msw";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { mockUser } from "../../test/fixtures/user.fixture";
import { server } from "../../test/mocks/server";
import { useAuthStore } from "../store/useAuthStore";
import { api } from "./apiClient";

const VITE_API_URL = "http://piku-server";

beforeEach(() => {
  useAuthStore.setState({
    accessToken: null,
    user: null,
    isInitializing: false,
  });
});

beforeAll(() => {
  vi.stubEnv("VITE_API_URL", VITE_API_URL);
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("request interceptor", () => {
  it("should attach Bearer token from the auth store to outgoing requests", async () => {
    useAuthStore.getState().setAuth("my-token", mockUser);

    let capturedAuthHeader = "";
    server.use(
      http.get(`${VITE_API_URL}/api/auth/me/`, ({ request }) => {
        capturedAuthHeader = request.headers.get("Authorization") ?? "";
        return HttpResponse.json(mockUser);
      }),
    );

    await api.get("/api/auth/me/");

    expect(capturedAuthHeader).toBe("Bearer my-token");
  });

  it("should not send Authorization header when the store has no token", async () => {
    let capturedAuthHeader: string | null = "";
    server.use(
      http.get(`${VITE_API_URL}/api/auth/me/`, ({ request }) => {
        capturedAuthHeader = request.headers.get("Authorization");
        return HttpResponse.json({});
      }),
    );

    await api.get("/api/auth/me/");

    expect(capturedAuthHeader).toBeNull();
  });
});

describe("response interceptor", () => {
  it("should call /refresh once on 401, then retry the original request with the new token", async () => {
    useAuthStore.getState().setAuth("expired-token", mockUser);
    let meApiCallCount = 0;
    let _refreshApiCallCount = 0;

    server.use(
      http.get(`${VITE_API_URL}/api/auth/me/`, ({ request }) => {
        meApiCallCount++;
        if (request.headers.get("Authorization") === "Bearer expired-token") {
          return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json(mockUser);
      }),
      http.post(`${VITE_API_URL}/api/auth/refresh/`, () => {
        _refreshApiCallCount++;
        return HttpResponse.json({ access: "refreshed-token" });
      }),
    );

    const response = await api.get("/api/auth/me/");

    expect(_refreshApiCallCount).toBe(1);
    expect(meApiCallCount).toBe(2);
    expect(response.data).toEqual(mockUser);
  });

  it("should update the auth store access token after a successful refresh", async () => {
    useAuthStore.getState().setAuth("expired-token", mockUser);

    server.use(
      http.get(`${VITE_API_URL}/api/auth/me/`, ({ request }) => {
        if (request.headers.get("Authorization") === "Bearer expired-token") {
          return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json(mockUser);
      }),
      http.post(`${VITE_API_URL}/api/auth/refresh/`, () =>
        HttpResponse.json({ access: "refreshed-token" }),
      ),
    );

    await api.get("/api/auth/me/");

    expect(useAuthStore.getState().accessToken).toBe("refreshed-token");
  });

  it("should call clearAuth and return the latest error when refresh also fails", async () => {
    useAuthStore.getState().setAuth("expired-token", mockUser);

    server.use(
      http.get(
        `${VITE_API_URL}/api/auth/me/`,
        () =>
          new HttpResponse(JSON.stringify({ detail: "Invalid token" }), {
            status: 401,
          }),
      ),
      http.post(
        `${VITE_API_URL}/api/auth/refresh/`,
        () =>
          new HttpResponse(JSON.stringify({ detail: "Refresh failed" }), {
            status: 401,
          }),
      ),
    );

    await expect(api.get("/api/auth/me/")).rejects.toThrow(
      expect.objectContaining({
        response: expect.objectContaining({
          data: { detail: "Refresh failed" },
        }),
      }),
    );
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
