import axios from "axios";
import { endpoints } from "../config/endpoints";
import { useAuthStore } from "../store/useAuthStore";

export const apiServerUrl = import.meta.env.VITE_API_URL;

// publicApi for endpoints that don't need authentication (login, refresh, register)
export const publicApi = axios.create({
  baseURL: apiServerUrl,
  withCredentials: true,
});

// api for all authenticated requests
export const api = axios.create({
  baseURL: apiServerUrl,
  withCredentials: true,
});
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// auto handle 401 errors by attempting a silent refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // if first time 401 and we haven't tried refreshing yet, we proceed with silent refresh
    // else it could mean the refresh also 401'd
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await publicApi.post(endpoints.REFRESH);
        const newAccessToken = data.access;

        // Update store with the latest accesstoken
        const { user, setAuth } = useAuthStore.getState();
        if (user) {
          setAuth(newAccessToken, user);
        }

        // retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
