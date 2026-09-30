import { createFileRoute } from "@tanstack/react-router";
import { WhapiAccountsPanel } from "@/components/admin/whapi-accounts-panel";

export const Route = createFileRoute("/admin/whatsapp-accounts")({
  head: () => ({
    meta: [
      { title: "حسابات واتساب — لوحة الإدارة" },
      {
        name: "description",
        content: "إدارة حسابات واتساب عبر Whapi وVercel بدون اعتماد على Render أو GOWA.",
      },
    ],
  }),
  component: WhatsAppAccountsPage,
});

function WhatsAppAccountsPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black tracking-tight">حسابات واتساب المباشرة</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vercel للوحة والـAPI، Whapi لجلسة واتساب الدائمة، وSupabase لبيانات المتجر والوسائط.
        </p>
      </div>

      <WhapiAccountsPanel />
    </div>
  );
}
