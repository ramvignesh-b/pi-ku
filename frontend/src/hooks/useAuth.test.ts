import { act, renderHook } from "@testing-library/react";
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
import { useKeyStore } from "../store/useKeyStore";
import { CryptoUtils } from "../utils/crypto";
import {
  clearMasterKey,
  loadMasterKey,
  saveMasterKey,
} from "../utils/keystore";
import { useAuth } from "./useAuth";

const API_URL = "http://piku-server";

vi.mock("../utils/crypto", () => ({
  CryptoUtils: {
    deriveMasterKey: vi
      .fn()
      .mockResolvedValue({ type: "secret" } as unknown as CryptoKey),
  },
}));

vi.mock("../utils/keystore", () => ({
  saveMasterKey: vi.fn().mockResolvedValue(undefined),
  loadMasterKey: vi
    .fn()
    .mockResolvedValue({ type: "secret" } as unknown as CryptoKey),
  clearMasterKey: vi.fn().mockResolvedValue(undefined),
}));

beforeAll(() => {
  vi.stubEnv("API_URL", API_URL);
});

afterAll(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    accessToken: null,
    user: null,
    isInitializing: true,
  });
  useKeyStore.setState({ masterKey: null });
});

describe("isAuthenticated", () => {
  it("should be false when access token is not present in the store", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should be true when access token is present in the store", () => {
    useAuthStore.setState({
      accessToken: "token",
      user: mockUser,
      isInitializing: false,
    });
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
  });
});

describe("login", () => {
  it("should derive the master key using the provided password and email (salt)", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login("access-token", mockUser, "test-password");
    });

    expect(CryptoUtils.deriveMasterKey).toHaveBeenCalledWith(
      "test-password",
      mockUser.email,
    );
  });

  it("should persist the derived master key to IndexedDB", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login("access-token", mockUser, "my-password");
    });

    expect(saveMasterKey).toHaveBeenCalledTimes(1);
  });

  it("should set the auth store with the provided access token and user profile", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login("my-access-token", mockUser, "my-password");
    });

    expect(useAuthStore.getState().accessToken).toBe("my-access-token");
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it("should load the master key into the key store", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login("token", mockUser, "my-password");
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
      http.post(`${API_URL}/api/auth/logout/`, () => {
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

  it("should clear the master key from both the key store and IndexedDB", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(useKeyStore.getState().masterKey).toBeNull();
    expect(clearMasterKey).toHaveBeenCalledTimes(1);
  });

  it("should clear auth store (access token + user) and master key even if API fails", async () => {
    server.use(
      http.post(
        `${API_URL}/api/auth/logout/`,
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
      http.post(`${API_URL}/api/auth/refresh/`, () => {
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

  it("should call /refresh restore master key from IndexedDB when session not in memory", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.initialize();
    });

    expect(useAuthStore.getState().accessToken).toBe("new-access-token");
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(loadMasterKey).toHaveBeenCalledTimes(1);
    expect(useKeyStore.getState().masterKey).not.toBeNull();
  });

  it("should clear auth + key store when refresh fails", async () => {
    server.use(
      http.post(
        `${API_URL}/api/auth/refresh/`,
        () => new HttpResponse(null, { status: 401 }),
      ),
    );
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.initialize();
    });

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useKeyStore.getState().masterKey).toBeNull();
  });
});
