import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Search,
  Globe,
  FileText,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Save,
  Share2,
  Loader2,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import { notifyStorefrontPublished } from "@/components/appearance-provider";
import {
  getSeoSettings,
  saveSeoSettings,
  evaluateSeoHealth,
  type GlobalSeoConfig,
} from "@/lib/seo-admin.functions";

export const Route = createFileRoute("/admin/seo")({
  head: () => ({
    meta: [
      { title: "مدير SEO — لوحة الإدارة" },
      { name: "description", content: "إدارة إعدادات SEO الشاملة، خريطة الموقع، محركات البحث والبيانات المنظمة." },
    ],
  }),
  component: AdminSeoComponent,
});

function AdminSeoComponent() {
  const queryClient = useQueryClient();
  const fetchSeoFn = useServerFn(getSeoSettings);
  const saveSeoFn = useServerFn(saveSeoSettings);

  const [activeTab, setActiveTab] = useState<"global" | "technical" | "schema" | "audit">("global");
  const [formData, setFormData] = useState<GlobalSeoConfig | null>(null);

  const { data: seoConfig, isLoading } = useQuery({
    queryKey: ["admin-seo-config"],
    queryFn: () => fetchSeoFn(),
  });

  useEffect(() => {
    if (seoConfig) setFormData(seoConfig);
  }, [seoConfig]);

  const saveMutation = useMutation({
    mutationFn: (data: GlobalSeoConfig) => saveSeoFn({ data }),
    onSuccess: () => {
      toast.success("تم حفظ إعدادات SEO بنجاح ✨");
      queryClient.invalidateQueries({ queryKey: ["admin-seo-config"] });
      queryClient.invalidateQueries({ queryKey: ["storefront-settings"] });
      queryClient.invalidateQueries({ queryKey: ["storefront-settings-cms-premium"] });
      void notifyStorefrontPublished();
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ أثناء حفظ الإعدادات");
    },
  });

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const auditReport = evaluateSeoHealth(formData);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Search className="h-7 w-7 text-primary" />
            مدير محركات البحث (SEO Manager)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            تكوين البيانات الوصفية العامة، تحسين الظهور في محرك بحث Google، خريطة الموقع والبيانات المنظمة (JSON-LD).
          </p>
        </div>

        <button
          onClick={() => saveMutation.mutate(formData)}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 shadow-brand disabled:opacity-50"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ التغييرات
        </button>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-border/80 gap-2 overflow-x-auto pb-1">
        {[
          { id: "global", label: "SEO العام والظهور", icon: Globe },
          { id: "technical", label: "الجانب التقني (Sitemap / Robots)", icon: FileText },
          { id: "schema", label: "بيانات Schema المنظمة", icon: Code2 },
          { id: "audit", label: `فحص الصحة وتدقيق النتائج (${auditReport.score}%)`, icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-t-xl px-4 py-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
                active
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Global SEO */}
      {activeTab === "global" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 bg-surface border border-border p-5 rounded-2xl shadow-sm">
            <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
              <Globe className="h-5 w-5 text-primary" /> البيانات الوصفية الرئيسية (Meta Tags)
            </h3>

            <div>
              <label className="block text-xs font-bold mb-1">العنوان الرئيسي للموقع (Meta Title)</label>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                المستحسن: 30 إلى 60 حرفاً ({formData.metaTitle.length} حرف حالياً)
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">الوصف العام (Meta Description)</label>
              <textarea
                rows={3}
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                المستحسن: 70 إلى 160 حرفاً ({formData.metaDescription.length} حرف حالياً)
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">رابط صورة المشاركة الاجتماعية (OG Image URL)</label>
              <input
                type="text"
                value={formData.ogImage}
                onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">نوع كارت تويتر (Twitter Card)</label>
              <select
                value={formData.twitterCard}
                onChange={(e) => setFormData({ ...formData, twitterCard: e.target.value as any })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="summary_large_image">صورة كبيرة (summary_large_image)</option>
                <option value="summary">موجز صغير (summary)</option>
              </select>
            </div>
          </div>

          {/* Real-time Google & Social Previews */}
          <div className="space-y-4">
            {/* Google Search Result Preview */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-primary" /> معاينة نتيجة البحث في Google
              </span>
              <div className="rounded-xl border border-border/60 bg-background p-4 space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">https://indexes-store.com</span>
                  <span>›</span>
                </div>
                <h4 className="text-base font-semibold text-[#1a0dab] hover:underline cursor-pointer dark:text-[#8ab4f8] truncate">
                  {formData.metaTitle || "عنوان المتجر"}
                </h4>
                <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2 leading-relaxed">
                  {formData.metaDescription || "وصف المتجر سيظهر هنا..."}
                </p>
              </div>
            </div>

            {/* Social Share Preview Card */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5 text-primary" /> معاينة المشاركة الاجتماعية (Facebook / WhatsApp)
              </span>
              <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
                {formData.ogImage ? (
                  <img src={formData.ogImage} alt="OG Preview" className="h-36 w-full object-cover" />
                ) : (
                  <div className="h-36 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    لا توجد صورة معاينة
                  </div>
                )}
                <div className="p-3 bg-surface">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">INDEXES-STORE.COM</p>
                  <p className="font-bold text-sm text-foreground truncate">{formData.metaTitle}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{formData.metaDescription}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Technical SEO */}
      {activeTab === "technical" && (
        <div className="space-y-6 bg-surface border border-border p-6 rounded-2xl shadow-sm max-w-3xl">
          <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-primary" /> الضوابط التقنية (Technical SEO)
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
              <div>
                <p className="text-sm font-bold">تفعيل خريطة الموقع (Sitemap XML)</p>
                <p className="text-xs text-muted-foreground">تتيح لمحركات البحث الزحف التلقائي للمنتجات والتصنيفات عبر /sitemap.xml</p>
              </div>
              <input
                type="checkbox"
                checked={formData.sitemapEnabled}
                onChange={(e) => setFormData({ ...formData, sitemapEnabled: e.target.checked })}
                className="h-5 w-5 rounded accent-primary cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
              <div>
                <p className="text-sm font-bold">تفعيل ملف الروبوت (Robots.txt Control)</p>
                <p className="text-xs text-muted-foreground">توجيه عناكب البحث والتحكم بالصفحات المسموح أرشفة محتواها.</p>
              </div>
              <input
                type="checkbox"
                checked={formData.robotsEnabled}
                onChange={(e) => setFormData({ ...formData, robotsEnabled: e.target.checked })}
                className="h-5 w-5 rounded accent-primary cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">محتوى ملف Robots.txt المخصص</label>
              <textarea
                rows={5}
                value={formData.robotsCustomDirectives}
                onChange={(e) => setFormData({ ...formData, robotsCustomDirectives: e.target.value })}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs font-mono focus:outline-none"
                dir="ltr"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Schema Markup */}
      {activeTab === "schema" && (
        <div className="space-y-6 bg-surface border border-border p-6 rounded-2xl shadow-sm max-w-3xl">
          <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
            <Code2 className="h-5 w-5 text-primary" /> هيكلية Schema.org (JSON-LD)
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold mb-1">اسم المؤسسة (Organization Name)</label>
              <input
                type="text"
                value={formData.schemaOrgName}
                onChange={(e) => setFormData({ ...formData, schemaOrgName: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">هاتف خدمة العملاء (Schema Phone)</label>
              <input
                type="text"
                value={formData.schemaPhone}
                onChange={(e) => setFormData({ ...formData, schemaPhone: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">الشارع والمنطقة (Street Address)</label>
              <input
                type="text"
                value={formData.schemaAddressStreet}
                onChange={(e) => setFormData({ ...formData, schemaAddressStreet: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">المدينة (City)</label>
              <input
                type="text"
                value={formData.schemaAddressCity}
                onChange={(e) => setFormData({ ...formData, schemaAddressCity: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: SEO Health Audit */}
      {activeTab === "audit" && (
        <div className="space-y-6 bg-surface border border-border p-6 rounded-2xl shadow-sm max-w-3xl">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> تقرير جودة SEO (Health Score)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                فحص آلي وتدقيق مدى التزام المتجر بمعايير محرك البحث Google.
              </p>
            </div>
            <div className="text-center">
              <span className="text-3xl font-black text-primary">{auditReport.score}%</span>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">معدل الجودة</p>
            </div>
          </div>

          <div className="space-y-2">
            {auditReport.warnings.map((w, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs font-semibold ${
                  w.type === "success"
                    ? "bg-success/10 border-success/30 text-success"
                    : w.type === "warning"
                    ? "bg-warning/10 border-warning/30 text-warning"
                    : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}
              >
                {w.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-success" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
                )}
                <span>{w.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
