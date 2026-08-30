import fs from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { preloadFont } from "./utils/preload-font";
import { getBaseUrl } from "./utils/url-builder";

// The homepage hero renders in Fraunces, and nothing asks for it until the Home
// chunk mounts, so without this it lands a second after the hero has painted.
const HERO_FONT = /fraunces-latin-full-normal-[^/]+\.woff2$/;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "../", "");

  // PROD Config
  if (mode === "production") {
    return {
      envDir: "../",
      plugins: [react(), tailwindcss(), preloadFont(HERO_FONT)],
      server: {
        port: Number(env.FRONTEND_PORT),
        host: env.FRONTEND_DOMAIN,
      },
    };
  }

  // DEV Config
  const isSslEnabled = env.SSL_ENABLED === "true";
  let sslCerts: { key: Buffer; cert: Buffer } | undefined;

  if (isSslEnabled) {
    sslCerts = {
      key: fs.readFileSync(
        path.resolve(__dirname, "../certs/localhost-key.pem"),
      ),
      cert: fs.readFileSync(path.resolve(__dirname, "../certs/localhost.pem")),
    };
  }

  return {
    envDir: "../",
    plugins: [react(), tailwindcss(), preloadFont(HERO_FONT)],
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(
        getBaseUrl(isSslEnabled, env.BACKEND_DOMAIN, env.BACKEND_PORT),
      ),
    },
    server: {
      port: Number(env.FRONTEND_PORT),
      host: env.FRONTEND_DOMAIN,
      https: isSslEnabled ? sslCerts : undefined,
    },
    preview: {
      port: Number(env.FRONTEND_PORT),
      host: env.FRONTEND_DOMAIN,
      https: isSslEnabled ? sslCerts : undefined,
    },
  };
});
