/**
 * Homepage first-load feedback loop.
 *
 * Symptom under test: a stranger opening the Homepage waits on a blank screen.
 *
 * Serves the production `dist` over a plain static server (no backend, no dev
 * server), cold-loads `/` in Chromium under pinned throttling, and asserts on
 * what has to arrive before the first pixel of content.
 *
 * The byte assertions are deterministic: the same build always produces the
 * same numbers. The timing assertions are the noisy ones, so their budgets are
 * loose and they are reported for information rather than trusted alone.
 *
 *   node perf/homepage-loop.mjs              # throttled, asserts budgets
 *   node perf/homepage-loop.mjs --report     # measure only, never fails
 *   node perf/homepage-loop.mjs --no-throttle
 *   node perf/homepage-loop.mjs --json out.json
 */

import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

import { serveDist } from "./serve-dist.mjs";

const distArg = process.argv.indexOf("--dist");
const DIST =
  distArg !== -1 && process.argv[distArg + 1]
    ? path.resolve(process.argv[distArg + 1])
    : path.resolve(import.meta.dirname, "../dist");

// Budgets are ratchets on what this build actually does today, with a little
// headroom - not aspirations. They exist to catch a regression, so when a
// change genuinely improves one of these, lower it in the same commit.
//
// Measured on the homepage, gzipped, under the throttling pinned below:
//   FCP ~1.3s | LCP ~3.5s | 130KB before the first paint
const BUDGETS = {
  blockingBytesBeforeFcp: 150_000,
  // Nothing should ever need a webfont before the first paint.
  fontBytesBeforeFcp: 0,
  fcpMs: 1_600,
  // Dominated by the hero's entrance animation, not by loading.
  lcpMs: 5_500,
  // Guards the preload. Without it the hero font arrives at ~4.6s, a second
  // after the text it is meant to be set in.
  heroFontMs: 2_600,
};

const HERO_FONT = /fraunces-latin-full-normal-.*\.woff2$/;

// Pinned "Slow 4G"-ish conditions. Fixed numbers matter more than realism:
// the loop needs the same verdict every run.
const NETWORK = {
  offline: false,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
  latency: 150,
};
const CPU_THROTTLE = 4;

// Installed before any page script so it cannot miss an early paint.
const OBSERVE = () => {
  window.__perf = { lcp: 0, rootFilledAt: 0 };

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__perf.lcp = entry.startTime;
      const el = entry.element;
      window.__perf.lcpEl = el
        ? `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${(el.className || "").toString().slice(0, 40)}`
        : "(none)";
      window.__perf.lcpSize = entry.size;
    }
  }).observe({ type: "largest-contentful-paint", buffered: true });

  // When did #root stop being an empty div? That is the blank screen ending.
  const watch = () => {
    const root = document.getElementById("root");
    if (!root) return requestAnimationFrame(watch);
    if (root.childElementCount > 0) {
      window.__perf.rootFilledAt = performance.now();
      return;
    }
    new MutationObserver((_, obs) => {
      if (root.childElementCount > 0) {
        window.__perf.rootFilledAt = performance.now();
        obs.disconnect();
      }
    }).observe(root, { childList: true });
  };
  watch();
};

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const ms = (n) => `${n.toFixed(0)} ms`;

async function measure({ throttle, externalUrl }) {
  // Point at a real server (a built container, say) instead of the built-in
  // static one, to measure what compression and cache headers actually do.
  const { server, origin } = externalUrl
    ? { server: { close() {} }, origin: externalUrl }
    : await serveDist(DIST);
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext({ bypassCSP: false });
    const page = await context.newPage();
    await page.addInitScript(OBSERVE);

    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    if (throttle) {
      await cdp.send("Network.emulateNetworkConditions", NETWORK);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE });
    }

    await page.goto(`${origin}/`, { waitUntil: "load", timeout: 60_000 });

    // The boot shell paints in milliseconds, so LCP would look settled long
    // before the app has mounted. Wait for the app's own work to finish first,
    // otherwise the shell flatters every number that follows it.
    await page
      .waitForLoadState("networkidle", { timeout: 30_000 })
      .catch(() => {});

    // LCP is only final once it stops moving. Entrance animations and late
    // fonts can promote a new candidate seconds after load, so poll until the
    // value has held still rather than guessing a fixed settle time.
    await page.waitForFunction(
      () => {
        const p = window.__perf;
        if (p.lcp !== p.__seen) {
          p.__seen = p.lcp;
          p.__stableSince = performance.now();
          return false;
        }
        return performance.now() - (p.__stableSince ?? 0) > 2_500;
      },
      null,
      { timeout: 30_000, polling: 250 },
    );

    return await page.evaluate(() => {
      const paint = performance.getEntriesByName("first-contentful-paint")[0];
      const fcp = paint ? paint.startTime : 0;
      const nav = performance.getEntriesByType("navigation")[0];

      const resources = performance.getEntriesByType("resource").map((r) => ({
        name: new URL(r.name).pathname,
        type: r.initiatorType,
        bytes: r.transferSize || r.encodedBodySize || 0,
        start: r.startTime,
        end: r.responseEnd,
      }));

      return {
        fcp,
        lcp: window.__perf.lcp,
        lcpEl: window.__perf.lcpEl,
        lcpSize: window.__perf.lcpSize,
        rootFilledAt: window.__perf.rootFilledAt,
        domContentLoaded: nav ? nav.domContentLoadedEventEnd : 0,
        htmlBytes: nav ? nav.transferSize || nav.encodedBodySize || 0 : 0,
        resources,
      };
    });
  } finally {
    await browser.close();
    server.close();
  }
}

function report(m) {
  // Anything that finished downloading before the first paint had the chance
  // to block it. That is the payload standing between a visitor and content.
  const beforeFcp = m.resources.filter((r) => r.end <= m.fcp);
  const fonts = beforeFcp.filter(
    (r) => r.name.endsWith(".woff2") || r.name.endsWith(".woff"),
  );
  const blockingBytes =
    m.htmlBytes + beforeFcp.reduce((sum, r) => sum + r.bytes, 0);
  const fontBytes = fonts.reduce((sum, r) => sum + r.bytes, 0);
  const allFonts = m.resources.filter(
    (r) => r.name.endsWith(".woff2") || r.name.endsWith(".woff"),
  );
  const heroFont = m.resources.find((r) => HERO_FONT.test(r.name));

  console.log("\n  Homepage cold load\n  " + "-".repeat(52));
  console.log(`  First contentful paint      ${ms(m.fcp)}`);
  console.log(`  #root first has children    ${ms(m.rootFilledAt)}`);
  console.log(`  Largest contentful paint    ${ms(m.lcp)}   ${m.lcpEl ?? ""}`);
  console.log(`  DOMContentLoaded            ${ms(m.domContentLoaded)}`);
  console.log("\n  Arrived before first paint\n  " + "-".repeat(52));
  console.log(
    `  Total                       ${kb(blockingBytes)}  (${beforeFcp.length + 1} requests)`,
  );
  console.log(
    `  Of which fonts              ${kb(fontBytes)}  (${fonts.length} files)`,
  );

  const top = [...beforeFcp].sort((a, b) => b.bytes - a.bytes).slice(0, 8);
  for (const r of top) {
    console.log(`    ${kb(r.bytes).padStart(10)}  ${r.name}`);
  }

  console.log(
    `\n  Fonts over the whole load   ${kb(allFonts.reduce((s, r) => s + r.bytes, 0))}  (${allFonts.length} files)`,
  );
  console.log(
    `  Hero font ready             ${ms(heroFont ? heroFont.end : Number.NaN)}`,
  );

  return {
    blockingBytes,
    fontBytes,
    fontCount: fonts.length,
    heroFontMs: heroFont ? heroFont.end : Number.NaN,
    beforeFcp,
    allFonts,
  };
}

function assertBudgets(m, agg) {
  const checks = [
    [
      "blocking bytes before FCP",
      agg.blockingBytes,
      BUDGETS.blockingBytesBeforeFcp,
      kb,
    ],
    ["font bytes before FCP", agg.fontBytes, BUDGETS.fontBytesBeforeFcp, kb],
    ["first contentful paint", m.fcp, BUDGETS.fcpMs, ms],
    ["largest contentful paint", m.lcp, BUDGETS.lcpMs, ms],
    ["hero font ready", agg.heroFontMs, BUDGETS.heroFontMs, ms],
  ];

  console.log("\n  Budgets\n  " + "-".repeat(52));
  let failed = 0;
  for (const [label, actual, budget, fmt] of checks) {
    const ok = actual <= budget;
    if (!ok) failed++;
    console.log(
      `  ${ok ? "PASS" : "FAIL"}  ${label.padEnd(28)} ${fmt(actual).padStart(10)} / ${fmt(budget)}`,
    );
  }
  return failed;
}

const args = process.argv.slice(2);
const jsonAt = args.indexOf("--json");

const urlAt = args.indexOf("--url");
const measurement = await measure({
  throttle: !args.includes("--no-throttle"),
  externalUrl: urlAt !== -1 ? args[urlAt + 1] : undefined,
});
const aggregate = report(measurement);

if (jsonAt !== -1 && args[jsonAt + 1]) {
  const { writeFile } = await import("node:fs/promises");
  await writeFile(
    args[jsonAt + 1],
    JSON.stringify({ measurement, aggregate }, null, 2),
  );
}

if (args.includes("--report")) {
  console.log("\n  (report mode — budgets not enforced)\n");
  process.exit(0);
}

const failures = assertBudgets(measurement, aggregate);
console.log("");
process.exit(failures > 0 ? 1 : 0);
