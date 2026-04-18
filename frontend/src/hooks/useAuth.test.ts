import { act, renderHook } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockMasterKey } from "../../test/fixtures/auth.fixture";
import { mockUser } from "../../test/fixtures/user.fixture";
import { server } from "../../test/mocks/server";
import { useAuthStore } from "../store/useAuthStore";
import { useKeyStore } from "../store/useKeyStore";
import {
  clearMasterKey,
  loadMasterKey,
  saveMasterKey,
} from "../utils/keystore";
import { useAuth } from "./useAuth";

vi.mock("../utils/keystore");

const VITE_API_URL = "http://piku-server";

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(loadMasterKey).mockResolvedValue(mockMasterKey);
  vi.mocked(saveMasterKey).mockResolvedValue("masterKey");
  vi.mocked(clearMasterKey).mockResolvedValue(undefined);

  useAuthStore.setState({
    accessToken: null,
    user: null,
    isInitializing: true,
  });
  useKeyStore.setState({ masterKey: null });
});

describe("isAuthenticated", () => {
  it("should be false when the access token is missing from the store", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should be true when the access token is present in the store", () => {
    useAuthStore.setState({
      accessToken: "token",
      user: mockUser,
      isInitializing: false,
    });
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
  });
});

describe("setAuthStore", () => {
  it("should persist the provided master key to IndexedDB", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.setAuthStore(
        "access-token",
        mockUser,
        mockMasterKey,
      );
    });

    expect(saveMasterKey).toHaveBeenCalledWith(mockMasterKey);
  });

  it("should update the store with the access token and user profile", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.setAuthStore(
        "my-access-token",
        mockUser,
        mockMasterKey,
      );
    });

    expect(useAuthStore.getState().accessToken).toBe("my-access-token");
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it("should load the master key into the key store", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.setAuthStore("token", mockUser, mockMasterKey);
    });

    expect(useKeyStore.getState().masterKey).not.toBeNull();
  });
});

describe("logout", () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: "active-token",
      user: mockUser,
      isInitializing: false,
    });
  });

  it("should call the logout API endpoint", async () => {
    let logoutCalled = false;
    server.use(
      http.post(`${VITE_API_URL}/api/auth/logout/`, () => {
        logoutCalled = true;
        return HttpResponse.json({});
      }),
    );

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.logout();
    });
    expect(logoutCalled).toBe(true);
  });

  it("should clear the master key from the store and IndexedDB", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(useKeyStore.getState().masterKey).toBeNull();
    expect(clearMasterKey).toHaveBeenCalledTimes(1);
  });

  it("should clear the auth store even if the API call fails", async () => {
    server.use(
      http.post(
        `${VITE_API_URL}/api/auth/logout/`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.logout();
    });

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});

describe("initialize", () => {
  it("should skip the refresh call when a session is already in memory", async () => {
    useAuthStore.setState({
      accessToken: "live-token",
      user: mockUser,
      isInitializing: true,
    });
    let refreshCalled = false;
    server.use(
      http.post(`${VITE_API_URL}/api/auth/refresh/`, () => {
        refreshCalled = true;
        return HttpResponse.json({ access: "new-token" });
      }),
    );

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.initialize();
    });

    expect(refreshCalled).toBe(false);
    expect(useAuthStore.getState().isInitializing).toBe(false);
  });

  it("should call /refresh and restore the master key when the session is empty", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.initialize();
    });

    expect(useAuthStore.getState().accessToken).toBe("new-access-token");
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(loadMasterKey).toHaveBeenCalledTimes(1);
    expect(useKeyStore.getState().masterKey).not.toBeNull();
  });

  it("should preserve the master key even if the refresh attempt fails", async () => {
    server.use(
      http.post(
        `${VITE_API_URL}/api/auth/refresh/`,
        () => new HttpResponse(null, { status: 401 }),
      ),
    );
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.initialize();
    });

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useKeyStore.getState().masterKey).not.toBeNull();
  });
});
