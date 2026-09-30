import { createFileRoute } from "@tanstack/react-router";
import { TikTokAccountsPanel } from "@/components/admin/tiktok-accounts-panel";

export const Route = createFileRoute("/admin/integrations/tiktok")({
  head: () => ({
    meta: [
      { title: "حسابات TikTok — لوحة الإدارة" },
      {
        name: "description",
        content: "ربط وإدارة حسابات TikTok متعددة عبر OAuth بشكل آمن.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TikTokIntegrationPage,
});

function TikTokIntegrationPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black tracking-tight">ربط حسابات TikTok</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          إضافة أكثر من حساب TikTok وربطه بمتجر اندكس مع فصل بيانات كل متجر عن الآخر.
        </p>
      </div>

      <TikTokAccountsPanel />
    </div>
  );
}
