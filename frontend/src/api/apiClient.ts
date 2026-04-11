import axios, { type AxiosError } from "axios";
import { endpoints } from "../config/endpoints";
import { useAuth } from "../store/useAuth";

const baseURL = import.meta.env.VITE_API_URL;

export const preAuthApiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const postAuthApiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// automatically attach access token to requests
postAuthApiClient.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// handle 401 & auto token refresh
postAuthApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // do not retry refresh request
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest.url?.includes(endpoints.REFRESH)
    ) {
      try {
        // refresh the access token
        const response = await preAuthApiClient.post(endpoints.REFRESH);

        if (response.status === 200) {
          const newAccessToken = response.data.access;

          // update the auth store so the retry uses the new token
          useAuth.setState({
            accessToken: newAccessToken,
            isAuthenticated: true,
          });

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return postAuthApiClient(originalRequest);
        }
      } catch (refreshError) {
        useAuth.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
