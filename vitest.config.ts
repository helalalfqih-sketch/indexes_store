import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    // singleFork: all test files run inside one shared fork process.
    // This prevents the Windows cold-start timeout that vitest-pool-runner
    // hits when it tries to launch a new child process per test file
    // (especially for files that switch to the jsdom environment).
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 30_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
