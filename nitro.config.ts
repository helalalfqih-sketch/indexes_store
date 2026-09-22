import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  // @sparticuz/chromium loads its compressed Linux binaries at runtime.
  // Full tracing keeps bin/*.br inside the Vercel Lambda instead of bundling
  // only the JavaScript entrypoints.
  traceDeps: ["@sparticuz/chromium*"],
});
