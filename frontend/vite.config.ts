import fs from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { getBaseUrl } from "./utils/url-builder";

/**
 * Vite emits the bundled stylesheets as plain <link rel="stylesheet">, which
 * blocks the first paint until all of them arrive - on this app that is ~166KB
 * standing between a visitor and any pixel at all. Load them asynchronously
 * instead and let the critical CSS inlined in index.html carry the boot shell.
 *
 * The <noscript> copy keeps the page styled when scripts are unavailable.
 */
/**
 * The boot shell in index.html draws the Pi. Ku. mark in Knewave. That font is
 * hashed at build time, so the URL is stitched in here and preloaded, letting
 * the shell paint in the real typeface instead of a serif stand-in.
 *
 * The file is one the app fetches anyway, so this moves bytes earlier rather
 * than adding any.
 */
function bootShellFont(): Plugin {
  const devUrl =
    "/node_modules/@fontsource/knewave/files/knewave-latin-400-normal.woff2";

  return {
    name: "piku-boot-shell-font",
    enforce: "post",
    transformIndexHtml(html, ctx) {
      const emitted = Object.keys(ctx.bundle ?? {}).find((file) =>
        /knewave-latin-400-normal.*\.woff2$/.test(file),
      );
      const url = emitted ? `/${emitted}` : devUrl;

      return html
        .replaceAll("__KNEWAVE_URL__", url)
        .replace(
          "</head>",
          `    <link rel="preload" href="${url}" as="font" type="font/woff2" crossorigin>\n</head>`,
        );
    },
  };
}

function asyncStylesheets(): Plugin {
  return {
    name: "piku-async-stylesheets",
    apply: "build",
    enforce: "post",
    transformIndexHtml(html) {
      return html.replace(
        /<link([^>]*?)rel="stylesheet"([^>]*?)>/g,
        (tag, before, after) =>
          `<link${before}rel="stylesheet"${after} media="print" onload="this.media='all'"><noscript>${tag}</noscript>`,
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "../", "");

  // PROD Config
  if (mode === "production") {
    return {
      envDir: "../",
      plugins: [react(), tailwindcss(), asyncStylesheets(), bootShellFont()],
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
    plugins: [react(), tailwindcss(), asyncStylesheets(), bootShellFont()],
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
