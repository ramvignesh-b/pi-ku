import axios from "axios";

const authApiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/auth/`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

authApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response.status === 401) {
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

export default authApiClient;
