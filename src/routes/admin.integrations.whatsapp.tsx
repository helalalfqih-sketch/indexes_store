import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  Copy,
  Check,
  Save,
  Loader2,
  Sparkles,
  Bot,
  ExternalLink,
  ShieldCheck,
  Send,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getWhatsAppConfig,
  saveWhatsAppConfig,
  saveWhatsAppConfig,
  type WhatsAppConfig,
} from "@/lib/whatsapp.functions";

export const Route = createFileRoute("/admin/integrations/whatsapp")({
  head: () => ({
    meta: [
      { title: "تكامل WhatsApp Media Sync — لوحة الإدارة" },
      { name: "description", content: "ربط واستقبال وسائط منتجات الواتساب وتحويلها تلقائياً بالذكاء الاصطناعي." },
    ],
  }),
  component: WhatsAppIntegrationComponent,
});

function WhatsAppIntegrationComponent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fetchConfigFn = useServerFn(getWhatsAppConfig);
  const saveConfigFn = useServerFn(saveWhatsAppConfig);

  const [formData, setFormData] = useState<WhatsAppConfig | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);



  const { data: waConfig, isLoading } = useQuery({
    queryKey: ["admin-whatsapp-config"],
    queryFn: () => fetchConfigFn(),
  });

  useEffect(() => {
    if (waConfig) setFormData(waConfig);
  }, [waConfig]);

  const saveMutation = useMutation({
    mutationFn: (data: WhatsAppConfig) => saveConfigFn({ data }),
    onSuccess: () => {
      toast.success("تم حفظ إعدادات الربط مع WhatsApp Cloud API بنجاح ✨");
      queryClient.invalidateQueries({ queryKey: ["admin-whatsapp-config"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل حفظ الإعدادات");
    },
  });



  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const webhookEndpoint = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/whatsapp`
    : "https://indexes-store.com/api/webhooks/whatsapp";

  const copyToClipboard = (text: string, type: "webhook" | "token") => {
    navigator.clipboard.writeText(text);
    if (type === "webhook") {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
    toast.success("تم نسخ النص إلى الحافظة");
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-emerald-500" />
            تكامل WhatsApp Media Sync
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            استقبال صور وفيديوهات المنتجات مباشرة من الواتساب وتحويلها تلقائياً إلى مكتبة الوسائط مع اقتراحات الذكاء الاصطناعي.
          </p>
        </div>

        <button
          onClick={() => saveMutation.mutate(formData)}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 shadow-brand disabled:opacity-50"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ إعدادات الربط
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>حالة الويب هوك (Webhook Status)</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-lg font-black text-emerald-500 flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="h-5 w-5" /> متصل ونشط
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-semibold">رقم الواتساب المرتبط</span>
          <p className="text-lg font-black text-foreground pt-1" dir="ltr">
            {formData.phoneNumber}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-semibold">إجمالي وسائط الواتساب المستوردة</span>
          <p className="text-lg font-black text-primary pt-1">
            {formData.mediaCount} وسيلة إعلام
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-semibold">آخر مزامنة (Last Sync)</span>
          <p className="text-xs font-mono font-bold text-muted-foreground pt-2 truncate" dir="ltr">
            {formData.lastSyncAt ? new Date(formData.lastSyncAt).toLocaleString("ar-YE") : "قبل قليل"}
          </p>
        </div>
      </div>

      {/* Setup Form & Webhook Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* WhatsApp Cloud API Credentials */}
        <div className="space-y-4 bg-surface border border-border p-5 rounded-2xl shadow-sm">
          <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-5 w-5 text-emerald-500" /> بيّانات الواتساب (WhatsApp Cloud API)
          </h3>

          <div>
            <label className="block text-xs font-bold mb-1">رقم WhatsApp Business الرئيسي</label>
            <input
              type="text"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="+967738609222"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">معرّف حساب الأعمال (WABA ID)</label>
            <input
              type="text"
              value={formData.wabaId}
              onChange={(e) => setFormData({ ...formData, wabaId: e.target.value })}
              placeholder="28459237033683884"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">معرّف تطبيق فيسبوك (Meta App ID)</label>
            <input
              type="text"
              value={formData.metaAppId || "1403080371744739"}
              onChange={(e) => setFormData({ ...formData, metaAppId: e.target.value })}
              placeholder="1403080371744739"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono text-emerald-400"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">البريد الإلكتروني للاتصال بالمسؤول (Contact Email)</label>
            <input
              type="email"
              value={formData.contactEmail || "smartaccuont@gmail.com"}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="smartaccuont@gmail.com"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">معرّف رقم الهاتف (Phone Number ID)</label>
            <input
              type="text"
              value={formData.phoneNumberId || "1307082469145976"}
              onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
              placeholder="1307082469145976"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">رمز التحقق المالي للويب هوك (Verify Token)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.verifyToken}
                onChange={(e) => setFormData({ ...formData, verifyToken: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(formData.verifyToken, "token")}
                className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold hover:bg-accent flex items-center gap-1 shrink-0"
              >
                {copiedToken ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                نسخ
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
            <div>
              <p className="text-xs font-bold">معالجة الذكاء الاصطناعي التلقائية (AI Auto-Draft)</p>
              <p className="text-[11px] text-muted-foreground">توليد اسم المنتج والوصف والسعر تلقائياً فور وصول الوسائط</p>
            </div>
            <input
              type="checkbox"
              checked={formData.autoAiProcess}
              onChange={(e) => setFormData({ ...formData, autoAiProcess: e.target.checked })}
              className="h-5 w-5 rounded accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Webhook Configuration Guide */}
        <div className="space-y-4 bg-surface border border-border p-5 rounded-2xl shadow-sm">
          <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
            <ExternalLink className="h-5 w-5 text-emerald-500" /> إعداد الويب هوك في Meta Developer Portal
          </h3>

          <div>
            <label className="block text-xs font-bold mb-1">رابط الويب هوك (Callback URL)</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={webhookEndpoint}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-emerald-500 select-all"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(webhookEndpoint, "webhook")}
                className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold hover:bg-accent flex items-center gap-1 shrink-0"
              >
                {copiedWebhook ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                نسخ
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-background p-4 space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> خطوات تفعيل المزامنة مع Meta:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px]">
              <li>ادخل إلى بوابة <strong className="text-foreground">Meta App Dashboard</strong> ثم اختر <strong className="text-foreground">WhatsApp Webhook</strong>.</li>
              <li>انسخ <strong>Callback URL</strong> الموضح أعلاه وضيعه في خانة Webhook URL.</li>
              <li>انسخ <strong>Verify Token</strong> وضعه في خانة Verification Token.</li>
              <li>فعّل اشتراك الأحدث على: <strong className="text-foreground font-mono">messages</strong>.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Meta WhatsApp Accounts List */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-emerald-500" /> حسابات واتساب للأعمال المسجلة في Meta (Meta WABA Accounts)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Account 1: اندكس للتجارة */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-foreground">اندكس للتجارة</span>
              <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full">مسجّل ✅</span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><strong className="text-foreground">معرف حساب الواتساب (WABA ID):</strong> <code className="font-mono text-emerald-400">28459237033683884</code></p>
              <p><strong className="text-foreground">رقم الهاتف:</strong> <span className="font-mono" dir="ltr">+967 738 609 222</span></p>
              <p><strong className="text-foreground">معرف رقم الهاتف (Phone ID):</strong> <code className="font-mono">1307082469145976</code></p>
            </div>
          </div>

          {/* Account 2: اندكس للتجارة 1 */}
          <div className="rounded-xl border border-border bg-background p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-foreground">اندكس للتجارة 1</span>
              <span className="text-[11px] font-bold bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full">لم يتم التحقق ⚠️</span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><strong className="text-foreground">معرف حساب الواتساب (WABA ID):</strong> <code className="font-mono text-muted-foreground">2347070759160644</code></p>
              <p><strong className="text-foreground">رقم الهاتف:</strong> <span className="font-mono" dir="ltr">+967 785 574 271</span></p>
              <p><strong className="text-foreground">معرف رقم الهاتف (Phone ID):</strong> <code className="font-mono">1282161161642455</code></p>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 Automated 5-Stage Pipeline Visualizer */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
          <div>
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" /> مسار الأتمتة الكامل: من المورد إلى الكتالوجات (Automated Pipeline)
            </h3>
            <p className="text-xs text-muted-foreground">تدفق البيانات الذكي من رسالة الواتساب حتى النشر في المتجر و Meta Catalog و Google Merchant</p>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full shrink-0">
            Auto-Sync Pipeline ⚡
          </span>
        </div>

        {/* Workflow Diagram */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-3 rounded-xl border border-border bg-background space-y-1">
            <span className="text-lg">📲</span>
            <p className="font-bold text-foreground">1. المورد يرسل</p>
            <p className="text-[10px] text-muted-foreground">10 صور + فيديو + سعر</p>
          </div>

          <div className="p-3 rounded-xl border border-border bg-background space-y-1">
            <span className="text-lg">⚡</span>
            <p className="font-bold text-foreground">2. Indexes Store</p>
            <p className="text-[10px] text-muted-foreground">استقبال الويب هوك</p>
          </div>

          <div className="p-3 rounded-xl border border-border bg-background space-y-1">
            <span className="text-lg">🤖</span>
            <p className="font-bold text-foreground">3. الذكاء الاصطناعي</p>
            <p className="text-[10px] text-muted-foreground">إنشاء مسودة المنتج</p>
          </div>

          <div className="p-3 rounded-xl border border-border bg-background space-y-1">
            <span className="text-lg">👁️</span>
            <p className="font-bold text-foreground">4. مراجعة الموظف</p>
            <p className="text-[10px] text-muted-foreground">الاعتماد بنقرة واحدة</p>
          </div>

          <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-1">
            <span className="text-lg">🚀</span>
            <p className="font-bold text-emerald-400">5. Meta + Google</p>
            <p className="text-[10px] text-emerald-400 font-bold">تزامن الكتالوجات المباشر</p>
          </div>
        </div>
      </div>

    </div>
  );
}
