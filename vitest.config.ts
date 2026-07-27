import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    passWithNoTests: true,
    include: ["tests/**/*.test.{ts,tsx}", "app/**/*.test.{ts,tsx}"],
  },
});
