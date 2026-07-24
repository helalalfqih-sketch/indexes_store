import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Moon,
  Sun,
  Zap,
  Check,
  Image as ImageIcon,
  Palette,
  Share2,
  Globe,
  Loader2,
  Save,
  Phone,
  Mail,
  MapPin,
  Clock,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAppearance, notifyStorefrontPublished } from "@/components/appearance-provider";
import { saveStorefrontDraft, updateStorefrontAppearance } from "@/lib/actions/appearance.actions";
import { MediaUploader } from "@/components/media-uploader";
import { toast } from "sonner";
import type {
  StoreIdentity,
  BrandSettings,
  SocialLinksSettings,
  GeneralStoreSettings,
} from "@/lib/domain/appearance";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

type Theme = "light" | "dark" | "neon";

function SettingsPage() {
  const { t } = useI18n();
  const { settings, setSettings } = useAppearance();
  const [theme, setTheme] = useState<Theme>("light");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 1. Store Identity state
  const [storeIdentity, setStoreIdentity] = useState<StoreIdentity>({
    logoUrl: settings.store_identity?.logoUrl || settings.navigation?.logoUrl || "",
    faviconUrl: settings.store_identity?.faviconUrl || "/favicon.ico",
    appleTouchIconUrl: settings.store_identity?.appleTouchIconUrl || "",
    pwaIcon192Url: settings.store_identity?.pwaIcon192Url || "",
    pwaIcon512Url: settings.store_identity?.pwaIcon512Url || "",
    themeColor: settings.store_identity?.themeColor || "#1F5EFF",
  });

  // 2. Brand Settings state
  const [brandSettings, setBrandSettings] = useState<BrandSettings>({
    storeName: settings.brand_settings?.storeName || settings.navigation?.storeName || "اندكس ستور",
    shortName: settings.brand_settings?.shortName || "NOQTA",
    description: settings.brand_settings?.description || settings.navigation?.footerDescription || "المتجر اليمني الإلكتروني الرائد للتسوق الفاخر والتجربة ثلاثية الأبعاد.",
    tagline: settings.brand_settings?.tagline || settings.navigation?.tagline || "اختيارك الأفضل",
    primaryColor: settings.brand_settings?.primaryColor || settings.theme?.primaryColor || "#4f8cff",
    secondaryColor: settings.brand_settings?.secondaryColor || settings.theme?.secondaryColor || "#a259ff",
    accentColor: settings.brand_settings?.accentColor || "#ff6b35",
  });

  // 3. Social Media Links state
  const [socialLinks, setSocialLinks] = useState<SocialLinksSettings>({
    facebook: {
      url: settings.social_links?.facebook?.url || settings.navigation?.socialLinks?.facebook || "https://facebook.com/indexes.store",
      enabled: settings.social_links?.facebook?.enabled ?? true,
    },
    instagram: {
      url: settings.social_links?.instagram?.url || settings.navigation?.socialLinks?.instagram || "https://instagram.com/indexes.store",
      enabled: settings.social_links?.instagram?.enabled ?? true,
    },
    tiktok: {
      url: settings.social_links?.tiktok?.url || settings.navigation?.socialLinks?.tiktok || "",
      enabled: settings.social_links?.tiktok?.enabled ?? false,
    },
    youtube: {
      url: settings.social_links?.youtube?.url || "",
      enabled: settings.social_links?.youtube?.enabled ?? false,
    },
    whatsapp: {
      url: settings.social_links?.whatsapp?.url || (settings.navigation?.whatsappPhone ? `https://wa.me/${settings.navigation.whatsappPhone}` : "https://wa.me/967771370740"),
      enabled: settings.social_links?.whatsapp?.enabled ?? true,
    },
    telegram: {
      url: settings.social_links?.telegram?.url || "",
      enabled: settings.social_links?.telegram?.enabled ?? false,
    },
  });

  // 4. General Store Settings state
  const [generalSettings, setGeneralSettings] = useState<GeneralStoreSettings>({
    phone: settings.general_settings?.phone || settings.navigation?.whatsappPhone || "967771370740",
    whatsapp: settings.general_settings?.whatsapp || settings.navigation?.whatsappPhone || "967771370740",
    email: settings.general_settings?.email || settings.navigation?.supportEmail || "support@indexes-store.com",
    address: settings.general_settings?.address || settings.navigation?.addressText || "صنعاء - شارع بينون - مقابل صيدلية الرعاية الصحية",
    currency: settings.general_settings?.currency || "YER",
    language: settings.general_settings?.language || "ar",
    country: settings.general_settings?.country || "اليمن",
    city: settings.general_settings?.city || "صنعاء",
    workingHours: settings.general_settings?.workingHours || "يومياً 9:00 ص - 10:00 م",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const th = (localStorage.getItem("noqta:theme") as Theme | null) ?? "light";
    setTheme(th);
    applyTheme(th);
  }, []);

  const applyTheme = (th: Theme) => {
    const root = document.documentElement;
    root.classList.remove("dark", "neon");
    if (th === "dark") root.classList.add("dark");
    if (th === "neon") root.classList.add("dark", "neon");
  };

  const save = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("noqta:theme", theme);
      applyTheme(theme);

      // Sync navigation block with identity & general settings for backwards compatibility
      const updatedNavigation = {
        ...settings.navigation,
        storeName: brandSettings.storeName,
        tagline: brandSettings.tagline,
        logoUrl: storeIdentity.logoUrl,
        footerDescription: brandSettings.description,
        whatsappPhone: generalSettings.whatsapp || generalSettings.phone,
        supportEmail: generalSettings.email,
        addressText: generalSettings.address,
        socialLinks: {
          facebook: socialLinks.facebook.enabled ? socialLinks.facebook.url : "",
          instagram: socialLinks.instagram.enabled ? socialLinks.instagram.url : "",
          tiktok: socialLinks.tiktok.enabled ? socialLinks.tiktok.url : "",
          twitter: socialLinks.telegram.enabled ? socialLinks.telegram.url : "",
        },
      };

      const updatedTheme = {
        ...settings.theme,
        primaryColor: brandSettings.primaryColor,
        secondaryColor: brandSettings.secondaryColor,
      };

      // Save each section to CMS storefront_settings
      await Promise.all([
        updateStorefrontAppearance({ data: { key: "store_identity", value: storeIdentity } }),
        updateStorefrontAppearance({ data: { key: "brand_settings", value: brandSettings } }),
        updateStorefrontAppearance({ data: { key: "social_links", value: socialLinks } }),
        updateStorefrontAppearance({ data: { key: "general_settings", value: generalSettings } }),
        updateStorefrontAppearance({ data: { key: "navigation", value: updatedNavigation } }),
        updateStorefrontAppearance({ data: { key: "theme", value: updatedTheme } }),
      ]);

      // Update local React state context
      setSettings({
        ...settings,
        store_identity: storeIdentity,
        brand_settings: brandSettings,
        social_links: socialLinks,
        general_settings: generalSettings,
        navigation: updatedNavigation,
        theme: updatedTheme,
      });

      void notifyStorefrontPublished();
      toast.success("تم حفظ جميع إعدادات الهوية والعلامة التجارية بنجاح ✨");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setIsSaving(false);
    }
  };

  const themes: { id: Theme; label: string; icon: typeof Sun }[] = [
    { id: "light", label: t("settings.theme.light"), icon: Sun },
    { id: "dark", label: t("settings.theme.dark"), icon: Moon },
    { id: "neon", label: t("settings.theme.neon"), icon: Zap },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black lg:text-3xl text-foreground flex items-center gap-2">
            <Palette className="h-7 w-7 text-primary" />
            إعدادات هوية المتجر والعلامة التجارية
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            إدارة الشعار والأيقونات والألوان وروابط التواصل والبيانات العامة للمتجر
          </p>
        </div>

        <button
          onClick={save}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-brand hover:bg-primary/90 transition disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? "جارٍ الحفظ..." : "حفظ كل التغييرات"}
        </button>
      </div>

      {/* 🎨 Section 1: Store Identity (هوية المتجر) */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            هوية المتجر والأيقونات (Store Identity)
          </h2>
          <span className="text-[11px] font-bold text-muted-foreground bg-accent/50 px-2.5 py-1 rounded-lg">
            PNG · SVG · WebP
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Logo Upload */}
          <div className="space-y-2">
            <MediaUploader
              label="شعار المتجر الرئيسي (Logo)"
              value={storeIdentity.logoUrl}
              mediaType="image"
              onChange={(val) => setStoreIdentity({ ...storeIdentity, logoUrl: val })}
            />
            <p className="text-[11px] text-muted-foreground">
              يُستخدم في الهيدر والفوتر والصفحات الرسمية وملفات SEO Schema
            </p>
          </div>

          {/* Favicon 16x16 / 32x32 */}
          <div className="space-y-2">
            <MediaUploader
              label="أيقونة الموقع (Favicon 16x16 / 32x32)"
              value={storeIdentity.faviconUrl}
              mediaType="image"
              onChange={(val) => setStoreIdentity({ ...storeIdentity, faviconUrl: val })}
            />
            <p className="text-[11px] text-muted-foreground">
              تظهر في تبويب المتصفح. الصيغ المستحسنة: .ico أو .png (32x32 بكسل)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/50">
          {/* Apple Touch Icon 180x180 */}
          <div>
            <MediaUploader
              label="أيقونة آبل (Apple Touch Icon 180x180)"
              value={storeIdentity.appleTouchIconUrl}
              mediaType="image"
              onChange={(val) => setStoreIdentity({ ...storeIdentity, appleTouchIconUrl: val })}
            />
          </div>

          {/* PWA 192x192 */}
          <div>
            <MediaUploader
              label="أيقونة تطبيق PWA (192x192)"
              value={storeIdentity.pwaIcon192Url}
              mediaType="image"
              onChange={(val) => setStoreIdentity({ ...storeIdentity, pwaIcon192Url: val })}
            />
          </div>

          {/* PWA 512x512 */}
          <div>
            <MediaUploader
              label="أيقونة تطبيق PWA (512x512)"
              value={storeIdentity.pwaIcon512Url}
              mediaType="image"
              onChange={(val) => setStoreIdentity({ ...storeIdentity, pwaIcon512Url: val })}
            />
          </div>
        </div>

        {/* Live Favicon & Logo Preview */}
        <div className="p-4 rounded-xl bg-background border border-border flex items-center gap-4">
          <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-lg border text-xs font-semibold text-foreground">
            {storeIdentity.faviconUrl ? (
              <img src={storeIdentity.faviconUrl} alt="Favicon" className="h-4 w-4 object-contain" />
            ) : (
              <Globe className="h-4 w-4 text-primary" />
            )}
            <span>{brandSettings.storeName || "اندكس ستور"} — معاينة التبويب</span>
          </div>
          {storeIdentity.logoUrl && (
            <div className="flex items-center gap-2 border-r border-border pr-4">
              <span className="text-xs text-muted-foreground">الشعار:</span>
              <img src={storeIdentity.logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" />
            </div>
          )}
        </div>
      </div>

      {/* 🏷️ Section 2: Brand Settings (إعدادات العلامة التجارية) */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div className="border-b border-border pb-3">
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            إعدادات العلامة التجارية والألوان (Brand Settings)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">اسم المتجر الكامل</label>
            <input
              value={brandSettings.storeName}
              onChange={(e) => setBrandSettings({ ...brandSettings, storeName: e.target.value })}
              placeholder="اندكس ستور"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">الاسم المختصر (Short Name)</label>
            <input
              value={brandSettings.shortName}
              onChange={(e) => setBrandSettings({ ...brandSettings, shortName: e.target.value })}
              placeholder="NOQTA"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">الشعار النصي (Tagline)</label>
            <input
              value={brandSettings.tagline}
              onChange={(e) => setBrandSettings({ ...brandSettings, tagline: e.target.value })}
              placeholder="اختيارك الأفضل للتسوق الرقمي"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">وصف المتجر المختصر</label>
            <input
              value={brandSettings.description}
              onChange={(e) => setBrandSettings({ ...brandSettings, description: e.target.value })}
              placeholder="المتجر اليمني الإلكتروني الرائد..."
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Brand Colors */}
        <div className="pt-2 border-t border-border/50">
          <label className="text-xs font-bold text-foreground block mb-3">ألوان الهوية البصرية (Brand Palette)</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
              <input
                type="color"
                value={brandSettings.primaryColor}
                onChange={(e) => setBrandSettings({ ...brandSettings, primaryColor: e.target.value })}
                className="h-9 w-9 rounded-lg border-0 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold block">اللون الرئيسي (Primary)</span>
                <span className="text-[11px] font-mono text-muted-foreground">{brandSettings.primaryColor}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
              <input
                type="color"
                value={brandSettings.secondaryColor}
                onChange={(e) => setBrandSettings({ ...brandSettings, secondaryColor: e.target.value })}
                className="h-9 w-9 rounded-lg border-0 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold block">اللون الثانوي (Secondary)</span>
                <span className="text-[11px] font-mono text-muted-foreground">{brandSettings.secondaryColor}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
              <input
                type="color"
                value={brandSettings.accentColor}
                onChange={(e) => setBrandSettings({ ...brandSettings, accentColor: e.target.value })}
                className="h-9 w-9 rounded-lg border-0 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold block">لون التميز (Accent)</span>
                <span className="text-[11px] font-mono text-muted-foreground">{brandSettings.accentColor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📣 Section 3: Social Media Branding (منصات التواصل الاجتماعي) */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div className="border-b border-border pb-3">
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            روابط وسائل التواصل الاجتماعي (Social Media Branding)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            تُستخدم في الفوتر والصفحات ومخطط JSON-LD وسيمتاجات Open Graph
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Facebook */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
            <input
              type="checkbox"
              checked={socialLinks.facebook.enabled}
              onChange={(e) => setSocialLinks({ ...socialLinks, facebook: { ...socialLinks.facebook, enabled: e.target.checked } })}
              className="h-4 w-4 rounded accent-primary cursor-pointer"
            />
            <div className="flex-1">
              <label className="text-xs font-bold text-muted-foreground block mb-1">فيسبوك (Facebook)</label>
              <input
                type="url"
                value={socialLinks.facebook.url}
                onChange={(e) => setSocialLinks({ ...socialLinks, facebook: { ...socialLinks.facebook, url: e.target.value } })}
                placeholder="https://facebook.com/..."
                className="w-full rounded-lg border border-border bg-surface p-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                dir="ltr"
              />
            </div>
          </div>

          {/* Instagram */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
            <input
              type="checkbox"
              checked={socialLinks.instagram.enabled}
              onChange={(e) => setSocialLinks({ ...socialLinks, instagram: { ...socialLinks.instagram, enabled: e.target.checked } })}
              className="h-4 w-4 rounded accent-primary cursor-pointer"
            />
            <div className="flex-1">
              <label className="text-xs font-bold text-muted-foreground block mb-1">إنستغرام (Instagram)</label>
              <input
                type="url"
                value={socialLinks.instagram.url}
                onChange={(e) => setSocialLinks({ ...socialLinks, instagram: { ...socialLinks.instagram, url: e.target.value } })}
                placeholder="https://instagram.com/..."
                className="w-full rounded-lg border border-border bg-surface p-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                dir="ltr"
              />
            </div>
          </div>

          {/* TikTok */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
            <input
              type="checkbox"
              checked={socialLinks.tiktok.enabled}
              onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: { ...socialLinks.tiktok, enabled: e.target.checked } })}
              className="h-4 w-4 rounded accent-primary cursor-pointer"
            />
            <div className="flex-1">
              <label className="text-xs font-bold text-muted-foreground block mb-1">تيك توك (TikTok)</label>
              <input
                type="url"
                value={socialLinks.tiktok.url}
                onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: { ...socialLinks.tiktok, url: e.target.value } })}
                placeholder="https://tiktok.com/@..."
                className="w-full rounded-lg border border-border bg-surface p-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                dir="ltr"
              />
            </div>
          </div>

          {/* YouTube */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
            <input
              type="checkbox"
              checked={socialLinks.youtube.enabled}
              onChange={(e) => setSocialLinks({ ...socialLinks, youtube: { ...socialLinks.youtube, enabled: e.target.checked } })}
              className="h-4 w-4 rounded accent-primary cursor-pointer"
            />
            <div className="flex-1">
              <label className="text-xs font-bold text-muted-foreground block mb-1">يوتيوب (YouTube)</label>
              <input
                type="url"
                value={socialLinks.youtube.url}
                onChange={(e) => setSocialLinks({ ...socialLinks, youtube: { ...socialLinks.youtube, url: e.target.value } })}
                placeholder="https://youtube.com/@..."
                className="w-full rounded-lg border border-border bg-surface p-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                dir="ltr"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
            <input
              type="checkbox"
              checked={socialLinks.whatsapp.enabled}
              onChange={(e) => setSocialLinks({ ...socialLinks, whatsapp: { ...socialLinks.whatsapp, enabled: e.target.checked } })}
              className="h-4 w-4 rounded accent-primary cursor-pointer"
            />
            <div className="flex-1">
              <label className="text-xs font-bold text-muted-foreground block mb-1">واتساب (WhatsApp Link)</label>
              <input
                type="url"
                value={socialLinks.whatsapp.url}
                onChange={(e) => setSocialLinks({ ...socialLinks, whatsapp: { ...socialLinks.whatsapp, url: e.target.value } })}
                placeholder="https://wa.me/967..."
                className="w-full rounded-lg border border-border bg-surface p-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                dir="ltr"
              />
            </div>
          </div>

          {/* Telegram */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
            <input
              type="checkbox"
              checked={socialLinks.telegram.enabled}
              onChange={(e) => setSocialLinks({ ...socialLinks, telegram: { ...socialLinks.telegram, enabled: e.target.checked } })}
              className="h-4 w-4 rounded accent-primary cursor-pointer"
            />
            <div className="flex-1">
              <label className="text-xs font-bold text-muted-foreground block mb-1">تيليجرام (Telegram)</label>
              <input
                type="url"
                value={socialLinks.telegram.url}
                onChange={(e) => setSocialLinks({ ...socialLinks, telegram: { ...socialLinks.telegram, url: e.target.value } })}
                placeholder="https://t.me/..."
                className="w-full rounded-lg border border-border bg-surface p-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                dir="ltr"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ⚙️ Section 4: General Store Settings (إعدادات المتجر العامة) */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div className="border-b border-border pb-3">
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            إعدادات التواصل والعمليات (General Settings)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1 flex items-center gap-1">
              <Phone className="h-3 w-3" /> رقم الهاتف
            </label>
            <input
              value={generalSettings.phone}
              onChange={(e) => setGeneralSettings({ ...generalSettings, phone: e.target.value })}
              placeholder="967771370740"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1 flex items-center gap-1">
              <Phone className="h-3 w-3 text-success" /> رقم الواتساب للطلبات
            </label>
            <input
              value={generalSettings.whatsapp}
              onChange={(e) => setGeneralSettings({ ...generalSettings, whatsapp: e.target.value })}
              placeholder="967771370740"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1 flex items-center gap-1">
              <Mail className="h-3 w-3" /> البريد الإلكتروني
            </label>
            <input
              value={generalSettings.email}
              onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
              placeholder="support@indexes-store.com"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> العنوان التفصيلي
            </label>
            <input
              value={generalSettings.address}
              onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
              placeholder="صنعاء - شارع بينون..."
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">العملة الافتراضية</label>
            <select
              value={generalSettings.currency}
              onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="YER">YER (ريال يمني)</option>
              <option value="SAR">SAR (ريال سعودي)</option>
              <option value="USD">USD (دولار أمريكي)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">اللغة الافتراضية</label>
            <select
              value={generalSettings.language}
              onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="ar">العربية (Arabic)</option>
              <option value="en">English (الإنجليزية)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">الدولة</label>
            <input
              value={generalSettings.country}
              onChange={(e) => setGeneralSettings({ ...generalSettings, country: e.target.value })}
              placeholder="اليمن"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">المدينة</label>
            <input
              value={generalSettings.city}
              onChange={(e) => setGeneralSettings({ ...generalSettings, city: e.target.value })}
              placeholder="صنعاء"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3" /> ساعات العمل
            </label>
            <input
              value={generalSettings.workingHours}
              onChange={(e) => setGeneralSettings({ ...generalSettings, workingHours: e.target.value })}
              placeholder="يومياً 9:00 ص - 10:00 م"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* 🌙 Theme Mode Selector */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-black mb-3">{t("settings.theme")}</h2>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((th) => {
            const Icon = th.icon;
            const active = theme === th.id;
            return (
              <button
                key={th.id}
                onClick={() => setTheme(th.id)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-bold transition ${
                  active
                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-surface"
                    : "border-border hover:bg-accent"
                }`}
              >
                <Icon className="h-5 w-5" />
                {th.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Save Button Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-brand hover:bg-primary/90 transition disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {t("settings.save")}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success">
            <Check className="h-4 w-4" /> {t("settings.saved")}
          </span>
        )}
      </div>
    </div>
  );
}
