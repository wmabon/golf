import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    globals: true,
    testTimeout: 60_000, // containers can be slow to start
    hookTimeout: 60_000,
    pool: "forks", // isolate tests that share DB state
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
