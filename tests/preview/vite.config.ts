import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
const file = (path: string) => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
  plugins: [react(), tailwind()],
  optimizeDeps: { entries: ["tests/preview/index.html"] },
  resolve: {
    alias: [
      { find: "@/lib/checkout-quote.functions", replacement: file("./quote.ts") },
      { find: "@/lib/actions/order.actions", replacement: file("./quote.ts") },
      { find: "@/components/appearance-provider", replacement: file("./appearance.ts") },
      { find: "@", replacement: file("../../src") },
    ],
  },
  server: { host: "127.0.0.1", port: 4173, strictPort: true },
});
