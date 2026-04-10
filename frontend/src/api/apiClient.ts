import axios, { type AxiosError } from "axios";
import { useAuth } from "../store/useAuth";

const authApiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/auth/`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

authApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (
      error.response.status === 401 &&
      !error.config.url?.includes("refresh/")
    ) {
      // token expired, refresh it
      try {
        const response = await authApiClient.post("refresh/");
        if (response.status === 200) {
          // refresh successful, retry the request
          return authApiClient(error.config);
        }
      } catch (error) {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

// automatically attach access token to request
authApiClient.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default authApiClient;
