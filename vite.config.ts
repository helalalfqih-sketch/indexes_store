import { defineConfig } from "@lovable.dev/vite-tanstack-config";

process.env.NITRO_PRESET = process.env.VERCEL ? "vercel" : "node-server";

export default defineConfig({
  tanstackStart: {
    ssr: false,
    server: { entry: "server" },
  },
  vite: {
    base: process.env.VERCEL ? "/" : "/app/",
  },
});
