import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: ["tests/e2e/**/*.spec.ts", "src/tests/e2e/**/*.spec.ts", "src/tests/a11y/**/*.spec.ts"],
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "node .output/server/index.mjs",
    url: "http://127.0.0.1:4173",
    env: {
      PORT: "4173",
      HOST: "127.0.0.1",
      NITRO_PORT: "4173",
      NITRO_HOST: "127.0.0.1",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
