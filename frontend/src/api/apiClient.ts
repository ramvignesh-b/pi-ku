import axios from "axios";
import { endpoints } from "../config/endpoints";
import { useAuthStore } from "../store/useAuthStore";

// publicApi for endpoints that don't need authentication (login, refresh, register)
export const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// api for all authenticated requests
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// auto-attach access token to authenticated requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors by attempting a silent refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt silent refresh
        const { data } = await publicApi.post(endpoints.REFRESH);
        const newAccessToken = data.access;

        // Update store
        const { user, setAuth } = useAuthStore.getState();
        if (user) {
          setAuth(newAccessToken, user);
        }

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, perform logout to clear tokens
        console.error("Session expired, logging out...");
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
