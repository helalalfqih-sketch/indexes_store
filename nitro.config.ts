import { defineNitroConfig } from "nitro/config";

const isCloudflare =
  process.env.CLOUDFLARE_WORKERS === "1" ||
  process.env.CF_PAGES === "1" ||
  process.env.WORKERS_CI === "1" ||
  process.env.npm_lifecycle_event === "build:cf" ||
  process.env.npm_lifecycle_event === "deploy:cf" ||
  process.env.npm_lifecycle_event === "preview:cf";

export default defineNitroConfig({
  ...(isCloudflare
    ? {}
    : {
        // @sparticuz/chromium loads its compressed Linux binaries at runtime.
        // Full tracing keeps bin/*.br inside the Vercel Lambda instead of bundling
        // only the JavaScript entrypoints.
        traceDeps: ["@sparticuz/chromium*"],
      }),
});
