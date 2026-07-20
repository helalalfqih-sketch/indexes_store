import { defineConfig } from "@lovable.dev/vite-tanstack-config";

process.env.NITRO_PRESET = "node-server";

export default defineConfig({
  tanstackStart: {
    ssr: false,
    server: { entry: "server" },
  },
  vite: {
    base: "/app/",
  },
});
