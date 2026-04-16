import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  envDir: "..",
  plugins: [react(), tailwindcss()],
  test: {
    env: {
      VITE_API_URL: "http://piku-server",
      TZ: "Asia/Kolkata",
    },
    include: ["**/*.test.ts"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["**/*.ts", "**/*.tsx"],
      exclude: ["node_modules", "dist", "**/*.d.ts", "./test/**", "./e2e/**"],
      thresholds: { lines: 80, functions: 80, branches: 80 },
    },
  },
});
