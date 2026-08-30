/**
 * Static server for the production `dist`, standing in for Caddy.
 *
 * Gzips what the Caddyfile gzips and sends no-store, so a measurement here
 * sees the same bytes production sends and every run is a cold load.
 *
 *   node perf/serve-dist.mjs --port 4179    # for lighthouse-ci
 */

import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import process from "node:process";
import { gzipSync } from "node:zlib";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
};

export async function serveDist(dist, port = 0) {
  const server = createServer(async (req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let filePath = path.join(dist, urlPath);

    try {
      const info = await stat(filePath);
      if (info.isDirectory()) filePath = path.join(filePath, "index.html");
    } catch {
      // SPA fallback: anything without a file extension is a client route.
      if (path.extname(urlPath)) {
        res.writeHead(404).end("not found");
        return;
      }
      filePath = path.join(dist, "index.html");
    }

    try {
      const raw = await readFile(filePath);
      const type = MIME[path.extname(filePath)] ?? "application/octet-stream";

      const compressible =
        /^(text\/|application\/(javascript|json|manifest))/.test(type);
      const gzipped =
        compressible && (req.headers["accept-encoding"] ?? "").includes("gzip");
      const body = gzipped ? gzipSync(raw) : raw;

      res.writeHead(200, {
        "content-type": type,
        "content-length": body.length,
        ...(gzipped
          ? { "content-encoding": "gzip", vary: "Accept-Encoding" }
          : {}),
        "cache-control": "no-store",
        "timing-allow-origin": "*",
      });
      res.end(body);
    } catch {
      res.writeHead(404).end("not found");
    }
  });

  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}

if (process.argv[1] === import.meta.filename) {
  const arg = (flag, fallback) => {
    const i = process.argv.indexOf(flag);
    return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
  };
  const dist = path.resolve(arg("--dist", path.join(import.meta.dirname, "../dist")));
  const { origin } = await serveDist(dist, Number(arg("--port", 0)));
  console.log(`serving ${dist} at ${origin}`);
}
