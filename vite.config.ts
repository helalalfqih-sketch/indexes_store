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
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        manifest: false,
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*supabase\.co\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-api-cache",
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
