import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "../", "");
  return {
    envDir: "../",
    plugins: [react(), tailwindcss()],
    server: {
      port: Number(env.FRONTEND_PORT),
      host: env.FRONTEND_DOMAIN,
    },
  };
});
