import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";
import type { PluginOption } from "vite";

// ── Deploy-target isolation ─────────────────────────────────────────
// Cloudflare Workers/Pages: set CLOUDFLARE_WORKERS=1 in the CF build env,
// or run one of the Cloudflare-targeted npm scripts (e.g. build:cf).
// Vercel:                 the VERCEL env var is set automatically.
// Local / other:          falls back to node-server via nitro.
const isCloudflare =
  process.env.CLOUDFLARE_WORKERS === "1" ||
  process.env.CF_PAGES === "1" ||
  process.env.WORKERS_CI === "1" ||
  process.env.npm_lifecycle_event === "build:cf" ||
  process.env.npm_lifecycle_event === "deploy:cf" ||
  process.env.npm_lifecycle_event === "preview:cf";

if (!isCloudflare) {
  process.env.NITRO_PRESET = process.env.VERCEL ? "vercel" : "node-server";
}

// Dynamically load the Cloudflare Vite plugin only when targeting CF.
// This avoids requiring @cloudflare/vite-plugin in Vercel / local builds.
const cfPlugins: PluginOption[] = [];
if (isCloudflare) {
  const { cloudflare } = await import("@cloudflare/vite-plugin");
  const res = cloudflare({ viteEnvironment: { name: "ssr" } });
  if (Array.isArray(res)) {
    cfPlugins.push(...res);
  } else {
    cfPlugins.push(res);
  }
}

export default defineConfig({
  tanstackStart: {
    ssr: false,
    server: { entry: "server" },
  },
  // Disable the built-in nitro deploy plugin for Cloudflare — the
  // @cloudflare/vite-plugin handles bundling + deployment instead.
  ...(isCloudflare ? { nitro: false } : {}),
  vite: {
    // Browser CI must exercise the same asset paths as the Vercel deployment.
    base: process.env.VERCEL || process.env.CI ? "/" : "/app/",
    resolve: {
      dedupe: ["three"],
    },
    ...(isCloudflare
      ? {
          build: {
            rolldownOptions: {
              external: ["@sparticuz/chromium", "playwright-core", /^chromium-bidi/],
            },
            rollupOptions: {
              external: ["@sparticuz/chromium", "playwright-core", /^chromium-bidi/],
            },
          },
        }
      : {
          ssr: {
            external: ["@sparticuz/chromium"],
          },
        }),
    plugins: [
      ...cfPlugins,
      VitePWA({
        outDir: ".output/public",
        registerType: "autoUpdate",
        manifest: false,
        workbox: {
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          cleanupOutdatedCaches: true,
          navigateFallbackDenylist: [
            /\/api\//,
            /supabase\.co\/auth\//,
            /supabase\.co\/rest\/v1\//,
            /supabase\.co\/storage\/v1\/object\/authenticated/,
            /supabase\.co\/functions\/v1\//,
          ],
          runtimeCaching: [
            {
              // Public storage assets ONLY — NEVER cache /auth/, /rest/v1/, or authenticated objects
              urlPattern: /^https:\/\/.*supabase\.co\/storage\/v1\/object\/public\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "supabase-public-storage-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
              },
            },
            {
              urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|webp|gif)/i,
              handler: "CacheFirst",
              options: {
                cacheName: "image-cache",
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
          ],
        },
      }),
    ],
  },
});
