import fs from "node:fs";
import path from "node:path";
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
      https: {
        key: fs.readFileSync(
          path.resolve(__dirname, "../certs/localhost-key.pem"),
        ),
        cert: fs.readFileSync(
          path.resolve(__dirname, "../certs/localhost.pem"),
        ),
      },
    },
  };
});
