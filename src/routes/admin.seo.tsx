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
  Twitter,
  Building2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { MediaUploader } from "@/components/media-uploader";
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

  const [activeTab, setActiveTab] = useState<"global" | "og_twitter" | "verification" | "technical" | "schema" | "audit">("global");
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

  // Generate live Organization JSON-LD preview
  const liveOrgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: formData.schemaOrgName || formData.siteName || "اندكس ستور",
    alternateName: formData.alternateName || "Indexes Store",
    logo: formData.schemaOrgLogo || formData.ogImage || "",
    telephone: formData.schemaPhone || "+967771370740",
    email: formData.schemaEmail || "support@indexes-store.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: formData.schemaAddressStreet || "شارع بينون",
      addressLocality: formData.schemaAddressCity || "صنعاء",
      addressCountry: formData.schemaCountry || "YE",
    },
  };

  const liveLocalBizJsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: formData.schemaBusinessName || formData.schemaOrgName || "اندكس ستور",
    telephone: formData.schemaPhone || "+967771370740",
    openingHours: formData.schemaOpeningHours || "Mo-Su 09:00-22:00",
    priceRange: formData.schemaPriceRange || "$$",
    address: {
      "@type": "PostalAddress",
      addressLocality: formData.schemaAddressCity || "صنعاء",
      addressCountry: formData.schemaCountry || "اليمن",
    },
  };

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
          { id: "global", label: "SEO العام والهوية", icon: Globe },
          { id: "og_twitter", label: "Open Graph و Twitter", icon: Share2 },
          { id: "verification", label: "أكواد التحقق (Google/Bing)", icon: ShieldCheck },
          { id: "technical", label: "الجانب التقني (Sitemap / Robots)", icon: FileText },
          { id: "schema", label: "بيانات Schema المنظمة", icon: Code2 },
          { id: "audit", label: `فحص الصحة (${auditReport.score}%)`, icon: Sparkles },
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

      {/* Tab 1: Global SEO & Site Identity */}
      {activeTab === "global" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 bg-surface border border-border p-5 rounded-2xl shadow-sm">
            <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
              <Globe className="h-5 w-5 text-primary" /> البيانات الوصفية الرئيسية وهوية الموقع
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">اسم الموقع (Site Name)</label>
                <input
                  type="text"
                  value={formData.siteName || ""}
                  onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                  placeholder="اندكس ستور"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">الاسم البديل (Alternate Name)</label>
                <input
                  type="text"
                  value={formData.alternateName || ""}
                  onChange={(e) => setFormData({ ...formData, alternateName: e.target.value })}
                  placeholder="Indexes Store"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  dir="ltr"
                />
              </div>
            </div>

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
          </div>

          {/* Real-time Google Search Result Preview */}
          <div className="space-y-4">
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
          </div>
        </div>
      )}

      {/* Tab 2: Open Graph & Twitter */}
      {activeTab === "og_twitter" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 bg-surface border border-border p-5 rounded-2xl shadow-sm">
            <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
              <Share2 className="h-5 w-5 text-primary" /> إعدادات Open Graph وتويتر / X
            </h3>

            <div>
              <label className="block text-xs font-bold mb-1">عنوان المشاركة المخصص (OG Title)</label>
              <input
                type="text"
                value={formData.ogTitle || ""}
                onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })}
                placeholder="اتركه فارغاً لاستخدام Meta Title تلقائياً"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">وصف المشاركة المخصص (OG Description)</label>
              <textarea
                rows={2}
                value={formData.ogDescription || ""}
                onChange={(e) => setFormData({ ...formData, ogDescription: e.target.value })}
                placeholder="اتركه فارغاً لاستخدام Meta Description تلقائياً"
                className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none"
              />
            </div>

            <div>
              <MediaUploader
                label="صورة المشاركة الاجتماعية (OG Image)"
                value={formData.ogImage}
                mediaType="image"
                onChange={(val) => setFormData({ ...formData, ogImage: val })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div>
                <label className="block text-xs font-bold mb-1">اسم مستخدم تويتر/X</label>
                <input
                  type="text"
                  value={formData.twitterUsername || ""}
                  onChange={(e) => setFormData({ ...formData, twitterUsername: e.target.value })}
                  placeholder="@indexes_store"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
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
          </div>

          {/* Social Preview Cards */}
          <div className="space-y-4">
            {/* Facebook / WhatsApp Preview Card */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5 text-primary" /> معاينة المشاركة في Facebook / WhatsApp
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
                  <p className="font-bold text-sm text-foreground truncate">
                    {formData.ogTitle || formData.metaTitle || "عنوان المتجر"}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {formData.ogDescription || formData.metaDescription || "وصف المتجر سيظهر هنا..."}
                  </p>
                </div>
              </div>
            </div>

            {/* Twitter Card Preview */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Twitter className="h-3.5 w-3.5 text-sky-500" /> معاينة Twitter / X Card
              </span>
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-background p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                    IS
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">اندكس ستور</p>
                    <p className="text-[10px] text-muted-foreground" dir="ltr">
                      {formData.twitterUsername || "@indexes_store"}
                    </p>
                  </div>
                </div>
                <div className="overflow-hidden rounded-xl border border-border/60">
                  {formData.ogImage && (
                    <img src={formData.ogImage} alt="Twitter Card" className="h-32 w-full object-cover" />
                  )}
                  <div className="p-2.5 bg-surface">
                    <p className="font-bold text-xs text-foreground truncate">
                      {formData.ogTitle || formData.metaTitle}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {formData.ogDescription || formData.metaDescription}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Google & Bing Verification Codes */}
      {activeTab === "verification" && (
        <div className="space-y-6 bg-surface border border-border p-6 rounded-2xl shadow-sm max-w-3xl">
          <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-5 w-5 text-primary" /> أدوات إثبات الملكية في محركات البحث
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1">رمز إثبات ملكية Google (Google Site Verification)</label>
              <input
                type="text"
                value={formData.googleVerificationCode || ""}
                onChange={(e) => setFormData({ ...formData, googleVerificationCode: e.target.value })}
                placeholder="google84868c536ade5c41.html أو الرمز المخصص"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-mono"
                dir="ltr"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                يُضاف تلقائياً في الوسم &lt;meta name="google-site-verification" content="..."&gt;
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">رمز إثبات ملكية Bing (Bing Webmaster Code)</label>
              <input
                type="text"
                value={formData.bingVerificationCode || ""}
                onChange={(e) => setFormData({ ...formData, bingVerificationCode: e.target.value })}
                placeholder="msvalidate.01 الرمز الخاص بـ"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-mono"
                dir="ltr"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                يُضاف تلقائياً في الوسم &lt;meta name="msvalidate.01" content="..."&gt;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Technical SEO */}
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

      {/* Tab 5: Schema Markup (Organization & LocalBusiness) */}
      {activeTab === "schema" && (
        <div className="space-y-6 bg-surface border border-border p-6 rounded-2xl shadow-sm">
          <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
            <Code2 className="h-5 w-5 text-primary" /> هيكلية Schema.org المنظمة (JSON-LD)
          </h3>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Organization & LocalBusiness Inputs */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-primary tracking-wider flex items-center gap-1.5">
                <Building2 className="h-4 w-4" /> 1. Organization Schema
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold mb-1">اسم المؤسسة (Organization Name)</label>
                  <input
                    type="text"
                    value={formData.schemaOrgName || ""}
                    onChange={(e) => setFormData({ ...formData, schemaOrgName: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">هاتف خدمة العملاء</label>
                  <input
                    type="text"
                    value={formData.schemaPhone || ""}
                    onChange={(e) => setFormData({ ...formData, schemaPhone: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">البريد الإلكتروني للـ Schema</label>
                  <input
                    type="email"
                    value={formData.schemaEmail || ""}
                    onChange={(e) => setFormData({ ...formData, schemaEmail: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">رابط الشعار للـ Schema (Logo URL)</label>
                  <input
                    type="text"
                    value={formData.schemaOrgLogo || ""}
                    onChange={(e) => setFormData({ ...formData, schemaOrgLogo: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    dir="ltr"
                  />
                </div>
              </div>

              <h4 className="text-xs font-black uppercase text-primary tracking-wider flex items-center gap-1.5 pt-2 border-t border-border">
                <MapPin className="h-4 w-4" /> 2. LocalBusiness Schema
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold mb-1">اسم النشاط المحلي (Business Name)</label>
                  <input
                    type="text"
                    value={formData.schemaBusinessName || ""}
                    onChange={(e) => setFormData({ ...formData, schemaBusinessName: e.target.value })}
                    placeholder="اندكس ستور"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">الشارع والمنطقة</label>
                  <input
                    type="text"
                    value={formData.schemaAddressStreet || ""}
                    onChange={(e) => setFormData({ ...formData, schemaAddressStreet: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">المدينة (City)</label>
                  <input
                    type="text"
                    value={formData.schemaAddressCity || ""}
                    onChange={(e) => setFormData({ ...formData, schemaAddressCity: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">ساعات العمل (Opening Hours)</label>
                  <input
                    type="text"
                    value={formData.schemaOpeningHours || ""}
                    onChange={(e) => setFormData({ ...formData, schemaOpeningHours: e.target.value })}
                    placeholder="Mo-Su 09:00-22:00"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Live JSON-LD Preview Box */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider">
                معاينة الكود الناتج (Live JSON-LD Script Output)
              </h4>
              <div className="rounded-xl border border-border bg-background p-4 font-mono text-[11px] text-emerald-400 dark:text-emerald-300 overflow-auto max-h-[380px] leading-relaxed" dir="ltr">
                <pre>{JSON.stringify([liveOrgJsonLd, liveLocalBizJsonLd], null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: SEO Health Audit */}
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
