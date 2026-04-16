import fs from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { getBaseUrl } from "./utils/url-builder";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "../", "");
  const isSslEnabled = env.SSL_ENABLED === "true";
  let ssl_certs: { key: Buffer; cert: Buffer };

  if (isSslEnabled) {
    ssl_certs = {
      key: fs.readFileSync(
        path.resolve(__dirname, "../certs/localhost-key.pem"),
      ),
      cert: fs.readFileSync(path.resolve(__dirname, "../certs/localhost.pem")),
    };
  }

  const baseApiUrl = getBaseUrl(
    isSslEnabled,
    env.BACKEND_DOMAIN,
    env.BACKEND_PORT,
  );
  console.log(baseApiUrl);
  return {
    envDir: "../",
    plugins: [react(), tailwindcss()],
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(baseApiUrl),
    },
    server: {
      port: Number(env.FRONTEND_PORT),
      host: env.FRONTEND_DOMAIN,
      https: isSslEnabled ? ssl_certs : undefined,
    },
  };
});
