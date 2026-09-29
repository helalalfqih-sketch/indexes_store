import { createFileRoute } from "@tanstack/react-router";
import { GowaAccountsPanel } from "@/components/admin/gowa-accounts-panel";

export const Route = createFileRoute("/admin/whatsapp-accounts")({
  head: () => ({
    meta: [
      { title: "حسابات واتساب المباشرة — لوحة الإدارة" },
      {
        name: "description",
        content: "إدارة عدة حسابات واتساب عبر الأجهزة المرتبطة وQR من داخل اندكس ستور.",
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
          إدارة جلسات GOWA متعددة الحسابات عبر الأجهزة المرتبطة، مع بقاء Meta وWhapi كمسارات مستقلة.
        </p>
      </div>

      <GowaAccountsPanel />
    </div>
  );
}
