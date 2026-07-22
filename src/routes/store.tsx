import { createFileRoute } from "@tanstack/react-router";
import { StoreShell } from "@/components/store/store-shell";

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: "لوحة المتجر — Indexes Store" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: StoreShell,
});
