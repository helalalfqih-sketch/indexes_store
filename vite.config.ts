import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

process.env.NITRO_PRESET = process.env.VERCEL ? "vercel" : "node-server";

export default defineConfig({
  tanstackStart: {
    ssr: false,
    server: { entry: "server" },
  },
  vite: {
    base: process.env.VERCEL ? "/" : "/app/",
    resolve: {
      dedupe: ["three"],
    },
    plugins: [
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
