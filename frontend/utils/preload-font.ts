import type { Plugin } from "vite";

export function preloadFont(match: RegExp): Plugin {
  let base = "/";

  return {
    name: "piku:preload-font",
    apply: "build",
    enforce: "post",

    configResolved(config) {
      base = config.base;
    },

    transformIndexHtml(_html, ctx) {
      const file = Object.keys(ctx.bundle ?? {}).find((name) =>
        match.test(name),
      );

      if (!file) {
        throw new Error(`preloadFont: no emitted asset matched ${match}`);
      }

      return [
        {
          tag: "link",
          attrs: {
            rel: "preload",
            as: "font",
            type: "font/woff2",
            href: `${base}${file}`,
            // Fonts are fetched in CORS mode; without this they download twice.
            crossorigin: "",
          },
          injectTo: "head",
        },
      ];
    },
  };
}
