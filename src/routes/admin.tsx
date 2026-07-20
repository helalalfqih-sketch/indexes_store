import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Indexes Store Admin — Dashboard" },
      { name: "description", content: "AI-powered commerce admin for Indexes Store." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminShell,
});
