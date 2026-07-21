import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/appearance")({
  head: () => ({ meta: [{ title: "مظهر المتجر — لوحة الإدارة" }] }),
  component: AdminAppearancePage,
});

function AdminAppearancePage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/admin/storefront", replace: true });
  }, [navigate]);

  return (
    <div className="flex h-96 flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-sm font-semibold">جاري توجيهك إلى مركز تحكم مظهر المتجر الجديد...</span>
    </div>
  );
}
