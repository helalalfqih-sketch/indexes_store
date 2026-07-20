import { createFileRoute } from "@tanstack/react-router";
import { BranchManager } from "@/components/branches/BranchManager";

export const Route = createFileRoute("/admin/branches")({
  head: () => ({
    meta: [{ title: "الفروع — إدارة المتجر" }, { name: "robots", content: "noindex" }],
  }),
  component: BranchesPage,
});

function BranchesPage() {
  return (
    <div className="space-y-6 p-6">
      <BranchManager />
    </div>
  );
}
