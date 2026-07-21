import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Layout,
  Palette,
  Grid3X3,
  ShoppingCart,
  Navigation,
  Search,
  Settings2,
  Eye,
  Upload,
  ChevronUp,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Globe,
  MonitorPlay,
  Sliders,
  AlignLeft,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
  User,
  FileText,
} from "lucide-react";
import { getStorefrontAppearance, updateStorefrontAppearance, getStorefrontChangeLogs } from "@/lib/actions/appearance.actions";
import {
  DEFAULT_STOREFRONT_SETTINGS,
  type StorefrontSettingsShape,
  type SectionsConfig,
  type HeroConfig,
  type ThemeConfig,
  type ProductsLayoutConfig,
  type ProductPageConfig,
  type CartConfig,
  type NavigationConfig,
  type SeoConfig,
  type AdvancedConfig,
} from "@/lib/domain/appearance";

export const Route = createFileRoute("/admin/storefront")({
  component: StorefrontCMSPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = "hero" | "sections" | "theme" | "products" | "product_page" | "cart" | "navigation" | "seo" | "advanced";

const TABS: Array<{ id: TabId; label: string; icon: typeof Layout }> = [
  { id: "hero", label: "البنر الرئيسي", icon: MonitorPlay },
  { id: "sections", label: "ترتيب الأقسام", icon: Layout },
  { id: "theme", label: "الثيم والألوان", icon: Palette },
  { id: "products", label: "شبكة المنتجات", icon: Grid3X3 },
  { id: "product_page", label: "صفحة المنتج", icon: Sliders },
  { id: "cart", label: "السلة والواتساب", icon: ShoppingCart },
  { id: "navigation", label: "التنقل والتذييل", icon: Navigation },
  { id: "seo", label: "إعدادات SEO", icon: Search },
  { id: "advanced", label: "متقدم", icon: Settings2 },
];

const SECTION_LABELS: Record<string, string> = {
  hero: "البنر الرئيسي ثلاثي الأبعاد",
  latest: "أحدث المنتجات",
  showroom: "المعرض الافتراضي",
  categories: "التصنيفات",
  deals: "عروض اليوم",
  cinematic: "العرض السينمائي",
  recommended: "الأكثر مبيعاً",
};

// ── Utility components ────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="block text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">
      {children}
      {required && <span className="text-destructive ms-0.5">*</span>}
    </span>
  );
}

const fieldCls =
  "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary transition mt-1";

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
        checked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
      }`}
    >
      {checked ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
      {checked ? "مفعّل" : "معطّل"}
    </button>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">
      <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">{title}</h3>
      {children}
    </div>
  );
}

// ── Tab panels ────────────────────────────────────────────────────────────────

function HeroTab({ cfg, onChange }: { cfg: HeroConfig; onChange: (v: HeroConfig) => void }) {
  const set = <K extends keyof HeroConfig>(k: K, v: HeroConfig[K]) =>
    onChange({ ...cfg, [k]: v });

  return (
    <div className="space-y-4">
      <SectionCard title="نوع البنر">
        <Field label="نوع الهيرو">
          <select value={cfg.type} onChange={(e) => set("type", e.target.value as HeroConfig["type"])} className={fieldCls}>
            <option value="sphere_3d">🌍 كرة المنتجات ثلاثية الأبعاد</option>
            <option value="banner_image">🖼️ صورة بنر</option>
            <option value="video">🎬 فيديو</option>
            <option value="slideshow">🎠 عروض شرائح</option>
            <option value="cinematic">🎭 وضع سينمائي</option>
          </select>
        </Field>
        <div className="flex items-center justify-between">
          <Label>تفعيل البنر</Label>
          <Toggle checked={cfg.enabled} onChange={(v) => set("enabled", v)} />
        </div>
      </SectionCard>

      <SectionCard title="النصوص">
        <Field label="نص الشارة (Badge)">
          <input value={cfg.badgeText} onChange={(e) => set("badgeText", e.target.value)} className={fieldCls} placeholder="INDEXES · LIVE SHOWCASE" />
        </Field>
        <Field label="العنوان الرئيسي">
          <input value={cfg.title} onChange={(e) => set("title", e.target.value)} className={fieldCls} />
        </Field>
        <Field label="العنوان الفرعي">
          <input value={cfg.subtitle} onChange={(e) => set("subtitle", e.target.value)} className={fieldCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="نص زر CTA">
            <input value={cfg.ctaText} onChange={(e) => set("ctaText", e.target.value)} className={fieldCls} />
          </Field>
          <Field label="رابط زر CTA">
            <input value={cfg.ctaLink} onChange={(e) => set("ctaLink", e.target.value)} className={fieldCls} dir="ltr" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="إعدادات الكرة ثلاثية الأبعاد">
        <div className="grid grid-cols-2 gap-3">
          <Field label="عدد المنتجات في الكرة">
            <input type="number" min={6} max={120} value={cfg.sphereMaxProducts} onChange={(e) => set("sphereMaxProducts", Number(e.target.value))} className={fieldCls} dir="ltr" />
          </Field>
          <Field label="نصف قطر الكرة">
            <input type="number" min={1} max={5} step={0.1} value={cfg.sphereRadius} onChange={(e) => set("sphereRadius", Number(e.target.value))} className={fieldCls} dir="ltr" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="حجم البطاقات">
            <input type="number" min={0.2} max={2} step={0.1} value={cfg.sphereTileScale} onChange={(e) => set("sphereTileScale", Number(e.target.value))} className={fieldCls} dir="ltr" />
          </Field>
          <Field label="شكل البطاقات">
            <select value={cfg.sphereCardShape} onChange={(e) => set("sphereCardShape", e.target.value as "rectangle" | "circle")} className={fieldCls}>
              <option value="rectangle">مستطيل</option>
              <option value="circle">دائري</option>
            </select>
          </Field>
        </div>
        <Field label="مصدر المنتجات">
          <select value={cfg.sphereProductSource} onChange={(e) => set("sphereProductSource", e.target.value as HeroConfig["sphereProductSource"])} className={fieldCls}>
            <option value="all">جميع المنتجات</option>
            <option value="bestsellers">الأكثر مبيعاً</option>
            <option value="offers">العروض</option>
            <option value="custom">اختيار يدوي</option>
          </select>
        </Field>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">عرض الاسم</span>
            <Toggle checked={cfg.sphereShowName} onChange={(v) => set("sphereShowName", v)} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">عرض السعر</span>
            <Toggle checked={cfg.sphereShowPrice} onChange={(v) => set("sphereShowPrice", v)} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">الجسيمات</span>
            <Toggle checked={cfg.showParticles} onChange={(v) => set("showParticles", v)} />
          </div>
        </div>
      </SectionCard>

      {(cfg.type === "banner_image") && (
        <SectionCard title="صورة البنر">
          <Field label="رابط الصورة">
            <input value={cfg.bannerImageUrl} onChange={(e) => set("bannerImageUrl", e.target.value)} className={fieldCls} placeholder="https://..." dir="ltr" />
          </Field>
        </SectionCard>
      )}
      {(cfg.type === "video") && (
        <SectionCard title="فيديو البنر">
          <Field label="رابط الفيديو">
            <input value={cfg.bannerVideoUrl} onChange={(e) => set("bannerVideoUrl", e.target.value)} className={fieldCls} placeholder="https://..." dir="ltr" />
          </Field>
        </SectionCard>
      )}
    </div>
  );
}

function SectionsTab({ cfg, onChange }: { cfg: SectionsConfig; onChange: (v: SectionsConfig) => void }) {
  const moveSection = (index: number, direction: "up" | "down") => {
    const order = [...cfg.sectionOrder];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= order.length) return;
    [order[index], order[newIndex]] = [order[newIndex], order[index]];
    onChange({ ...cfg, sectionOrder: order });
  };

  const toggleSection = (key: string) => {
    const sectionKey = key as keyof SectionsConfig;
    const section = cfg[sectionKey] as { enabled: boolean } | undefined;
    if (!section || typeof section !== "object") return;
    onChange({ ...cfg, [sectionKey]: { ...section, enabled: !section.enabled } });
  };

  const isSectionEnabled = (key: string): boolean => {
    const sectionKey = key as keyof SectionsConfig;
    const section = cfg[sectionKey];
    if (section && typeof section === "object" && "enabled" in section) {
      return (section as { enabled: boolean }).enabled;
    }
    return true;
  };

  return (
    <div className="space-y-4">
      <SectionCard title="ترتيب الأقسام على الصفحة الرئيسية">
        <p className="text-xs text-muted-foreground">اسحب أو استخدم أسهم الترتيب لتغيير ترتيب أقسام الصفحة الرئيسية.</p>
        <div className="space-y-2">
          {cfg.sectionOrder.map((key, index) => (
            <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black text-muted-foreground tabular-nums w-5 text-center">{index + 1}</span>
                <span className="text-sm font-bold">{SECTION_LABELS[key] ?? key}</span>
              </div>
              <div className="flex items-center gap-2">
                {key !== "hero" && (
                  <Toggle
                    checked={isSectionEnabled(key)}
                    onChange={() => toggleSection(key)}
                  />
                )}
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveSection(index, "up")}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-accent disabled:opacity-30 transition"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={index === cfg.sectionOrder.length - 1}
                  onClick={() => moveSection(index, "down")}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-accent disabled:opacity-30 transition"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="إعداد كل قسم">
        {(["latest", "categories", "deals", "recommended"] as const).map((key) => {
          const sec = cfg[key];
          return (
            <div key={key} className="rounded-xl border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{SECTION_LABELS[key]}</span>
                <Toggle checked={sec.enabled} onChange={(v) => onChange({ ...cfg, [key]: { ...sec, enabled: v } })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="عنوان القسم">
                  <input value={sec.title} onChange={(e) => onChange({ ...cfg, [key]: { ...sec, title: e.target.value } })} className={fieldCls} />
                </Field>
                <Field label="عدد المنتجات">
                  <input type="number" min={2} max={24} value={sec.limit} onChange={(e) => onChange({ ...cfg, [key]: { ...sec, limit: Number(e.target.value) } })} className={fieldCls} dir="ltr" />
                </Field>
              </div>
            </div>
          );
        })}

        {/* Showroom */}
        <div className="rounded-xl border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">{SECTION_LABELS.showroom}</span>
            <Toggle checked={cfg.showroom.enabled} onChange={(v) => onChange({ ...cfg, showroom: { ...cfg.showroom, enabled: v } })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="العنوان">
              <input value={cfg.showroom.title} onChange={(e) => onChange({ ...cfg, showroom: { ...cfg.showroom, title: e.target.value } })} className={fieldCls} />
            </Field>
            <Field label="شارة">
              <input value={cfg.showroom.badge} onChange={(e) => onChange({ ...cfg, showroom: { ...cfg.showroom, badge: e.target.value } })} className={fieldCls} />
            </Field>
          </div>
          <Field label="الوصف الفرعي">
            <input value={cfg.showroom.subtitle} onChange={(e) => onChange({ ...cfg, showroom: { ...cfg.showroom, subtitle: e.target.value } })} className={fieldCls} />
          </Field>
        </div>

        {/* Trust badges */}
        <div className="rounded-xl border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">شارات الثقة</span>
            <Toggle checked={cfg.trustBadges.enabled} onChange={(v) => onChange({ ...cfg, trustBadges: { ...cfg.trustBadges, enabled: v } })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["badge1", "badge2", "badge3"] as const).map((b) => (
              <Field key={b} label={b}>
                <input value={cfg.trustBadges[b]} onChange={(e) => onChange({ ...cfg, trustBadges: { ...cfg.trustBadges, [b]: e.target.value } })} className={fieldCls} />
              </Field>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function ThemeTab({ cfg, onChange }: { cfg: ThemeConfig; onChange: (v: ThemeConfig) => void }) {
  const set = <K extends keyof ThemeConfig>(k: K, v: ThemeConfig[K]) =>
    onChange({ ...cfg, [k]: v });

  return (
    <div className="space-y-4">
      <SectionCard title="الألوان">
        <div className="grid grid-cols-2 gap-4">
          <Field label="اللون الأساسي (Primary)">
            <div className="flex gap-2 mt-1">
              <input type="color" value={cfg.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-surface p-0.5" />
              <input value={cfg.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className={`${fieldCls} !mt-0 font-mono text-xs`} dir="ltr" />
            </div>
          </Field>
          <Field label="اللون الثانوي (Secondary)">
            <div className="flex gap-2 mt-1">
              <input type="color" value={cfg.secondaryColor} onChange={(e) => set("secondaryColor", e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-surface p-0.5" />
              <input value={cfg.secondaryColor} onChange={(e) => set("secondaryColor", e.target.value)} className={`${fieldCls} !mt-0 font-mono text-xs`} dir="ltr" />
            </div>
          </Field>
        </div>
        <Field label="لون خلفية الموقع">
          <div className="flex gap-2 mt-1">
            <input type="color" value={cfg.backgroundColor} onChange={(e) => set("backgroundColor", e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-surface p-0.5" />
            <input value={cfg.backgroundColor} onChange={(e) => set("backgroundColor", e.target.value)} className={`${fieldCls} !mt-0 font-mono text-xs`} dir="ltr" />
          </div>
        </Field>
      </SectionCard>

      <SectionCard title="الخط والوضع">
        <div className="grid grid-cols-2 gap-3">
          <Field label="نوع الخط">
            <select value={cfg.fontFamily} onChange={(e) => set("fontFamily", e.target.value as ThemeConfig["fontFamily"])} className={fieldCls}>
              <option value="Tajawal">Tajawal (افتراضي)</option>
              <option value="Cairo">Cairo</option>
              <option value="Inter">Inter (إنجليزي)</option>
            </select>
          </Field>
          <Field label="وضع العرض">
            <select value={cfg.defaultMode} onChange={(e) => set("defaultMode", e.target.value as ThemeConfig["defaultMode"])} className={fieldCls}>
              <option value="dark">داكن 🌙</option>
              <option value="light">فاتح ☀️</option>
              <option value="system">حسب الجهاز</option>
            </select>
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="التصميم والرسوم">
        <div className="grid grid-cols-3 gap-3">
          <Field label="انحناء الحواف">
            <select value={cfg.borderRadius} onChange={(e) => set("borderRadius", e.target.value as ThemeConfig["borderRadius"])} className={fieldCls}>
              {["sm", "md", "lg", "xl", "2xl", "full"].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="ستايل البطاقات">
            <select value={cfg.cardStyle} onChange={(e) => set("cardStyle", e.target.value as ThemeConfig["cardStyle"])} className={fieldCls}>
              <option value="glass">زجاجي</option>
              <option value="solid">صلب</option>
              <option value="bordered">محدد</option>
            </select>
          </Field>
          <Field label="سرعة التحريك">
            <select value={cfg.animationSpeed} onChange={(e) => set("animationSpeed", e.target.value as ThemeConfig["animationSpeed"])} className={fieldCls}>
              <option value="none">بدون</option>
              <option value="slow">بطيء</option>
              <option value="normal">عادي</option>
              <option value="fast">سريع</option>
            </select>
          </Field>
        </div>
        <div className="flex items-center justify-between">
          <Label>وضع العرض الاحترافي (Showcase Mode)</Label>
          <Toggle checked={cfg.showcaseModeEnabled} onChange={(v) => set("showcaseModeEnabled", v)} />
        </div>
      </SectionCard>
    </div>
  );
}

function ProductsTab({ cfg, onChange }: { cfg: ProductsLayoutConfig; onChange: (v: ProductsLayoutConfig) => void }) {
  const set = <K extends keyof ProductsLayoutConfig>(k: K, v: ProductsLayoutConfig[K]) =>
    onChange({ ...cfg, [k]: v });

  return (
    <div className="space-y-4">
      <SectionCard title="تخطيط الشبكة">
        <div className="grid grid-cols-3 gap-3">
          <Field label="أعمدة (شاشة كبيرة)">
            <input type="number" min={2} max={6} value={cfg.columnsDesktop} onChange={(e) => set("columnsDesktop", Number(e.target.value))} className={fieldCls} dir="ltr" />
          </Field>
          <Field label="أعمدة (تابلت)">
            <input type="number" min={1} max={4} value={cfg.columnsTablet ?? 3} onChange={(e) => set("columnsTablet", Number(e.target.value))} className={fieldCls} dir="ltr" />
          </Field>
          <Field label="أعمدة (الجوال)">
            <input type="number" min={1} max={3} value={cfg.columnsMobile} onChange={(e) => set("columnsMobile", Number(e.target.value))} className={fieldCls} dir="ltr" />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="حجم البطاقة">
            <select value={cfg.cardSize} onChange={(e) => set("cardSize", e.target.value as ProductsLayoutConfig["cardSize"])} className={fieldCls}>
              <option value="small">صغير</option>
              <option value="medium">متوسط</option>
              <option value="large">كبير</option>
            </select>
          </Field>
          <Field label="نسبة الصورة">
            <select value={cfg.aspectRatio} onChange={(e) => set("aspectRatio", e.target.value as ProductsLayoutConfig["aspectRatio"])} className={fieldCls}>
              <option value="square">مربع</option>
              <option value="portrait">عمودي</option>
              <option value="video">16:9</option>
            </select>
          </Field>
          <Field label="تأثير hover">
            <select value={cfg.hoverEffect} onChange={(e) => set("hoverEffect", e.target.value as ProductsLayoutConfig["hoverEffect"])} className={fieldCls}>
              <option value="scale">تكبير</option>
              <option value="glow">توهج</option>
              <option value="none">بدون</option>
            </select>
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="عدد المنتجات لكل قسم">
        <div className="grid grid-cols-3 gap-3">
          <Field label="أحدث المنتجات">
            <input type="number" min={4} max={24} value={cfg.latestProductsLimit} onChange={(e) => set("latestProductsLimit", Number(e.target.value))} className={fieldCls} dir="ltr" />
          </Field>
          <Field label="الأكثر مبيعاً">
            <input type="number" min={2} max={12} value={cfg.bestSellersLimit} onChange={(e) => set("bestSellersLimit", Number(e.target.value))} className={fieldCls} dir="ltr" />
          </Field>
          <Field label="العروض اليومية">
            <input type="number" min={2} max={12} value={cfg.dailyDealsLimit} onChange={(e) => set("dailyDealsLimit", Number(e.target.value))} className={fieldCls} dir="ltr" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="عناصر بطاقة المنتج (تشغيل / إيقاف)">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { key: "showImage", label: "الصورة" },
              { key: "showPrice", label: "السعر" },
              { key: "showDiscount", label: "نسبة الخصم" },
              { key: "showRating", label: "التقييم" },
              { key: "showStock", label: "المخزون" },
              { key: "showAddToCartButton", label: "زر السلة" },
              { key: "showWaBtn", label: "زر الواتساب" },
              { key: "showWishlist", label: "المفضلة" },
            ] as const
          ).map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-xs font-bold">{item.label}</span>
              <Toggle
                checked={Boolean(cfg[item.key as keyof ProductsLayoutConfig])}
                onChange={(v) => set(item.key as keyof ProductsLayoutConfig, v as any)}
              />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function ProductPageTab({ cfg, onChange }: { cfg: ProductPageConfig; onChange: (v: ProductPageConfig) => void }) {
  const set = <K extends keyof ProductPageConfig>(k: K, v: ProductPageConfig[K]) =>
    onChange({ ...cfg, [k]: v });

  return (
    <div className="space-y-4">
      <SectionCard title="عرض عناصر صفحة المنتج (Product Page Builder)">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { key: "showImages", label: "عرض الصور" },
              { key: "showVideo", label: "عرض الفيديو" },
              { key: "show3DModel", label: "نموذج 3D" },
              { key: "showDescription", label: "وصف المنتج" },
              { key: "showWaBtn", label: "زر الطلب عبر واتساب" },
              { key: "showCartBtn", label: "زر الإضافة للسلة" },
              { key: "showRelatedProducts", label: "المنتجات المشابهة" },
              { key: "showRecommendedProducts", label: "المنتجات المقترحة" },
            ] as const
          ).map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-xs font-bold">{item.label}</span>
              <Toggle
                checked={Boolean(cfg[item.key as keyof ProductPageConfig])}
                onChange={(v) => set(item.key as keyof ProductPageConfig, v)}
              />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function CartTab({ cfg, onChange }: { cfg: CartConfig; onChange: (v: CartConfig) => void }) {
  const set = <K extends keyof CartConfig>(k: K, v: CartConfig[K]) =>
    onChange({ ...cfg, [k]: v });

  return (
    <div className="space-y-4">
      <SectionCard title="واتساب والطلبات">
        <Field label="رقم واتساب" required>
          <input value={cfg.whatsappPhone} onChange={(e) => set("whatsappPhone", e.target.value)} className={fieldCls} placeholder="967770000000" dir="ltr" />
        </Field>
        <Field label="قالب رسالة الطلب">
          <textarea
            value={cfg.whatsappOrderTemplate}
            onChange={(e) => set("whatsappOrderTemplate", e.target.value)}
            rows={5}
            className={`${fieldCls} resize-y font-mono text-xs`}
            style={{ maxHeight: "200px" }}
          />
          <span className="text-[10px] text-muted-foreground mt-1 block">
            المتغيرات: {"{products}"}, {"{total}"}, {"{name}"}, {"{address}"}
          </span>
        </Field>
      </SectionCard>

      <SectionCard title="خيارات السلة">
        <div className="grid grid-cols-2 gap-3">
          {(["floatingBarEnabled", "quickWhatsAppOrder", "couponFieldEnabled", "deliveryFormEnabled"] as const).map((k) => (
            <div key={k} className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-xs font-bold">
                {k === "floatingBarEnabled" ? "شريط عائم" : k === "quickWhatsAppOrder" ? "طلب واتساب سريع" : k === "couponFieldEnabled" ? "حقل كوبون" : "نموذج التوصيل"}
              </span>
              <Toggle checked={cfg[k]} onChange={(v) => set(k, v)} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="موضع الشريط">
            <select value={cfg.floatingBarPosition} onChange={(e) => set("floatingBarPosition", e.target.value as CartConfig["floatingBarPosition"])} className={fieldCls}>
              <option value="bottom">أسفل الشاشة</option>
              <option value="top">أعلى الشاشة</option>
            </select>
          </Field>
          <Field label="حد الشحن المجاني (0 = غير فعّال)">
            <input type="number" min={0} value={cfg.freeShippingThreshold} onChange={(e) => set("freeShippingThreshold", Number(e.target.value))} className={fieldCls} dir="ltr" />
          </Field>
        </div>
        <Field label="نص الشحن الافتراضي">
          <input value={cfg.defaultShippingText} onChange={(e) => set("defaultShippingText", e.target.value)} className={fieldCls} />
        </Field>
      </SectionCard>
    </div>
  );
}

function NavigationTab({ cfg, onChange }: { cfg: NavigationConfig; onChange: (v: NavigationConfig) => void }) {
  const set = <K extends keyof NavigationConfig>(k: K, v: NavigationConfig[K]) =>
    onChange({ ...cfg, [k]: v });

  const moveLink = (index: number, dir: "up" | "down") => {
    const links = [...cfg.headerLinks];
    const newIdx = dir === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= links.length) return;
    [links[index], links[newIdx]] = [links[newIdx], links[index]];
    onChange({ ...cfg, headerLinks: links.map((l, i) => ({ ...l, order: i + 1 })) });
  };

  return (
    <div className="space-y-4">
      <SectionCard title="هوية المتجر">
        <div className="grid grid-cols-2 gap-3">
          <Field label="اسم المتجر">
            <input value={cfg.storeName} onChange={(e) => set("storeName", e.target.value)} className={fieldCls} />
          </Field>
          <Field label="الشعار الفرعي">
            <input value={cfg.tagline} onChange={(e) => set("tagline", e.target.value)} className={fieldCls} />
          </Field>
        </div>
        <Field label="رابط اللوجو (URL)">
          <input value={cfg.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} className={fieldCls} placeholder="https://..." dir="ltr" />
        </Field>
      </SectionCard>

      <SectionCard title="معلومات التواصل">
        <div className="grid grid-cols-2 gap-3">
          <Field label="واتساب">
            <input value={cfg.whatsappPhone} onChange={(e) => set("whatsappPhone", e.target.value)} className={fieldCls} dir="ltr" />
          </Field>
          <Field label="البريد الإلكتروني">
            <input value={cfg.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} className={fieldCls} dir="ltr" />
          </Field>
        </div>
        <Field label="العنوان">
          <input value={cfg.addressText} onChange={(e) => set("addressText", e.target.value)} className={fieldCls} />
        </Field>
        <Field label="معلومات التوصيل">
          <input value={cfg.deliveryInfoText} onChange={(e) => set("deliveryInfoText", e.target.value)} className={fieldCls} />
        </Field>
      </SectionCard>

      <SectionCard title="وسائل التواصل الاجتماعي">
        <div className="grid gap-3">
          {(["facebook", "instagram", "twitter"] as const).map((k) => (
            <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}>
              <input value={cfg.socialLinks[k]} onChange={(e) => set("socialLinks", { ...cfg.socialLinks, [k]: e.target.value })} className={fieldCls} dir="ltr" placeholder="https://..." />
            </Field>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="روابط التنقل في الهيدر">
        <div className="space-y-2">
          {cfg.headerLinks
            .sort((a, b) => a.order - b.order)
            .map((link, index) => (
              <div key={index} className="rounded-xl border border-border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Toggle checked={link.visible} onChange={(v) => {
                      const links = [...cfg.headerLinks];
                      links[index] = { ...links[index], visible: v };
                      set("headerLinks", links);
                    }} />
                    <span className="text-sm font-bold">{link.label}</span>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" disabled={index === 0} onClick={() => moveLink(index, "up")} className="rounded p-1 hover:bg-accent disabled:opacity-30">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" disabled={index === cfg.headerLinks.length - 1} onClick={() => moveLink(index, "down")} className="rounded p-1 hover:bg-accent disabled:opacity-30">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="النص">
                    <input value={link.label} onChange={(e) => {
                      const links = [...cfg.headerLinks];
                      links[index] = { ...links[index], label: e.target.value };
                      set("headerLinks", links);
                    }} className={fieldCls} />
                  </Field>
                  <Field label="الرابط">
                    <input value={link.to} onChange={(e) => {
                      const links = [...cfg.headerLinks];
                      links[index] = { ...links[index], to: e.target.value };
                      set("headerLinks", links);
                    }} className={fieldCls} dir="ltr" />
                  </Field>
                </div>
              </div>
            ))}
        </div>
      </SectionCard>

      <SectionCard title="التذييل">
        <Field label="وصف المتجر في التذييل">
          <textarea value={cfg.footerDescription} onChange={(e) => set("footerDescription", e.target.value)} rows={3} className={`${fieldCls} resize-none`} />
        </Field>
        <Field label="نص حقوق النشر">
          <input value={cfg.copyrightText} onChange={(e) => set("copyrightText", e.target.value)} className={fieldCls} />
        </Field>
      </SectionCard>
    </div>
  );
}

function SeoTab({ cfg, onChange }: { cfg: SeoConfig; onChange: (v: SeoConfig) => void }) {
  const set = <K extends keyof SeoConfig>(k: K, v: SeoConfig[K]) =>
    onChange({ ...cfg, [k]: v });

  const titleLen = cfg.metaTitle.length;
  const descLen = cfg.metaDescription.length;

  return (
    <div className="space-y-4">
      <SectionCard title="عناوين ووصف محركات البحث">
        <Field label="عنوان الصفحة (Meta Title)" required>
          <input value={cfg.metaTitle} onChange={(e) => set("metaTitle", e.target.value.slice(0, 70))} className={fieldCls} />
          <span className={`text-[10px] mt-0.5 block ${titleLen > 60 ? "text-warning" : "text-muted-foreground"}`}>
            {titleLen}/60 حرف {titleLen > 60 && "⚠️ طويل"}
          </span>
        </Field>
        <Field label="وصف الصفحة (Meta Description)">
          <textarea
            value={cfg.metaDescription}
            onChange={(e) => set("metaDescription", e.target.value.slice(0, 170))}
            rows={3}
            className={`${fieldCls} resize-none`}
          />
          <span className={`text-[10px] mt-0.5 block ${descLen > 160 ? "text-warning" : "text-muted-foreground"}`}>
            {descLen}/160 حرف {descLen > 160 && "⚠️ طويل"}
          </span>
        </Field>

        {/* Google Preview */}
        <div className="rounded-xl border border-border bg-white/5 p-3 space-y-1">
          <span className="text-[10px] text-muted-foreground">معاينة Google</span>
          <p className="text-primary text-sm font-medium truncate">{cfg.metaTitle || "عنوان الصفحة"}</p>
          <p className="text-success text-[11px] truncate" dir="ltr">https://indexes-store.vercel.app/</p>
          <p className="text-foreground/70 text-xs line-clamp-2">{cfg.metaDescription || "وصف الصفحة..."}</p>
        </div>
      </SectionCard>

      <SectionCard title="Open Graph (مشاركة اجتماعية)">
        <Field label="صورة المشاركة (OG Image)">
          <input value={cfg.ogImage} onChange={(e) => set("ogImage", e.target.value)} className={fieldCls} placeholder="https://..." dir="ltr" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="عرض الصورة (px)">
            <input type="number" value={cfg.ogImageWidth} onChange={(e) => set("ogImageWidth", Number(e.target.value))} className={fieldCls} dir="ltr" />
          </Field>
          <Field label="ارتفاع الصورة (px)">
            <input type="number" value={cfg.ogImageHeight} onChange={(e) => set("ogImageHeight", Number(e.target.value))} className={fieldCls} dir="ltr" />
          </Field>
        </div>
        <Field label="لون ثيم المتصفح (Theme Color)">
          <div className="flex gap-2 mt-1">
            <input type="color" value={cfg.themeColor} onChange={(e) => set("themeColor", e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-surface p-0.5" />
            <input value={cfg.themeColor} onChange={(e) => set("themeColor", e.target.value)} className={`${fieldCls} !mt-0 font-mono text-xs`} dir="ltr" />
          </div>
        </Field>
      </SectionCard>

      <SectionCard title="أدوات التحليل">
        <Field label="Google Analytics ID">
          <input value={cfg.googleAnalyticsId} onChange={(e) => set("googleAnalyticsId", e.target.value)} className={fieldCls} placeholder="G-XXXXXXXXXX" dir="ltr" />
        </Field>
        <Field label="Facebook Pixel ID">
          <input value={cfg.facebookPixelId} onChange={(e) => set("facebookPixelId", e.target.value)} className={fieldCls} placeholder="123456789012345" dir="ltr" />
        </Field>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Label>Sitemap XML</Label>
            <Toggle checked={cfg.sitemapEnabled} onChange={(v) => set("sitemapEnabled", v)} />
          </div>
          <div className="flex items-center gap-3">
            <Label>Robots.txt</Label>
            <Toggle checked={cfg.robotsEnabled} onChange={(v) => set("robotsEnabled", v)} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function AdvancedTab({ cfg, onChange }: { cfg: AdvancedConfig; onChange: (v: AdvancedConfig) => void }) {
  const set = <K extends keyof AdvancedConfig>(k: K, v: AdvancedConfig[K]) =>
    onChange({ ...cfg, [k]: v });

  return (
    <div className="space-y-4">
      <SectionCard title="إعدادات الكرة ثلاثية الأبعاد">
        <div className="grid grid-cols-2 gap-3">
          <Field label="عدد الجسيمات">
            <input type="number" min={0} max={500} value={cfg.sphereParticleCount} onChange={(e) => set("sphereParticleCount", Number(e.target.value))} className={fieldCls} dir="ltr" />
          </Field>
          <Field label="شدة التوهج (0-3)">
            <input type="number" min={0} max={3} step={0.1} value={cfg.sphereGlowIntensity} onChange={(e) => set("sphereGlowIntensity", Number(e.target.value))} className={fieldCls} dir="ltr" />
          </Field>
          <Field label="سرعة الدوران (0-2)">
            <input type="number" min={0} max={2} step={0.05} value={cfg.sphereRotationSpeed} onChange={(e) => set("sphereRotationSpeed", Number(e.target.value))} className={fieldCls} dir="ltr" />
          </Field>
        </div>
        <div className="flex items-center justify-between">
          <Label>دوران تلقائي</Label>
          <Toggle checked={cfg.sphereAutoRotate} onChange={(v) => set("sphereAutoRotate", v)} />
        </div>
      </SectionCard>

      <SectionCard title="الأداء والميزات">
        <div className="grid grid-cols-2 gap-3">
          {(["enableParallax", "enableLazyLoading", "enablePwa"] as const).map((k) => (
            <div key={k} className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-xs font-bold">
                {k === "enableParallax" ? "Parallax" : k === "enableLazyLoading" ? "Lazy Loading" : "PWA Support"}
              </span>
              <Toggle checked={cfg[k]} onChange={(v) => set(k, v)} />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="CSS مخصص">
        <p className="text-xs text-muted-foreground">يمكنك إضافة متغيرات CSS مخصصة بصيغة JSON. مثال: {"{ \"--custom-color\": \"#ff0000\" }"}</p>
        <Field label="CSS Variables (JSON)">
          <textarea
            value={cfg.customStylesJson}
            onChange={(e) => set("customStylesJson", e.target.value)}
            rows={4}
            className={`${fieldCls} font-mono text-xs resize-y`}
            style={{ maxHeight: "200px" }}
            dir="ltr"
            placeholder='{}'
          />
        </Field>
      </SectionCard>
    </div>
  );
}

// ── Change logs ────────────────────────────────────────────────────────────────

function ChangeLogsPanel() {
  const getLogs = useServerFn(getStorefrontChangeLogs);
  const logsQ = useQuery({
    queryKey: ["storefront-change-logs"],
    queryFn: () => getLogs(),
    refetchInterval: 30_000,
  });

  const logs = logsQ.data ?? [];

  const actionLabel = (type: string) => {
    if (type === "publish") return { label: "نشر", cls: "bg-success/10 text-success" };
    if (type === "save_draft") return { label: "مسودة", cls: "bg-primary/10 text-primary" };
    return { label: type, cls: "bg-muted text-muted-foreground" };
  };

  if (!logs.length) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
      <h3 className="text-sm font-bold flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        آخر التغييرات
      </h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {logs.slice(0, 10).map((log) => {
          const { label, cls } = actionLabel(log.action_type);
          return (
            <div key={log.id} className="flex items-center justify-between gap-2 text-xs">
              <span className={`rounded-full px-2 py-0.5 font-bold text-[10px] ${cls}`}>{label}</span>
              <span className="text-muted-foreground font-mono truncate">{log.key_changed}</span>
              <span className="text-muted-foreground shrink-0 flex items-center gap-1">
                <User className="h-3 w-3" />
                {log.user_email?.split("@")[0] ?? "—"}
              </span>
              <span className="text-muted-foreground shrink-0">
                {new Date(log.created_at).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

function StorefrontCMSPage() {
  const getSettings = useServerFn(getStorefrontAppearance);
  const saveSettings = useServerFn(updateStorefrontAppearance);

  const [activeTab, setActiveTab] = useState<TabId>("hero");
  const [local, setLocal] = useState<StorefrontSettingsShape>(DEFAULT_STOREFRONT_SETTINGS);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const dirty = useRef(false);

  // Load initial settings
  const settingsQ = useQuery({
    queryKey: ["storefront-settings-cms"],
    queryFn: () => getSettings(),
    staleTime: 10_000,
  });

  useEffect(() => {
    if (settingsQ.data) {
      setLocal(settingsQ.data);
      dirty.current = false;
    }
  }, [settingsQ.data]);

  const handleChange = useCallback(<K extends keyof StorefrontSettingsShape>(key: K, value: StorefrontSettingsShape[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
    dirty.current = true;
  }, []);

  const saveMut = useMutation({
    mutationFn: async () => {
      // Save only the active tab's key
      const tabToKey: Record<TabId, keyof StorefrontSettingsShape> = {
        hero: "hero",
        sections: "sections",
        theme: "theme",
        products: "products_layout",
        product_page: "product_page",
        cart: "cart_config",
        navigation: "navigation",
        seo: "seo",
        advanced: "advanced",
      };
      const key = tabToKey[activeTab];
      return saveSettings({ data: { key, value: local[key] } });
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success("✅ تم حفظ الإعدادات بنجاح!");
        setSavedAt(new Date());
        dirty.current = false;
      } else {
        toast.error(res.message ?? "حدث خطأ أثناء الحفظ");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveAllMut = useMutation({
    mutationFn: async () => {
      const keys: Array<keyof StorefrontSettingsShape> = [
        "hero",
        "sections",
        "theme",
        "products_layout",
        "product_page",
        "cart_config",
        "navigation",
        "seo",
        "advanced",
      ];
      const results = await Promise.all(
        keys.map((key) => saveSettings({ data: { key, value: local[key] } }))
      );
      return results;
    },
    onSuccess: () => {
      toast.success("✅ تم نشر جميع الإعدادات!");
      setSavedAt(new Date());
      dirty.current = false;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (settingsQ.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">جاري تحميل الإعدادات...</span>
      </div>
    );
  }

  const isPending = saveMut.isPending || saveAllMut.isPending;

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black sm:text-2xl flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            مركز تحكم Storefront CMS
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            تحكم كامل في جميع عناصر واجهة العميل — بدون أي تدخل مبرمج.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold hover:bg-accent transition"
          >
            <Eye className="h-4 w-4" />
            معاينة المتجر
          </a>
        </div>
      </div>

      {/* Status Bar */}
      {savedAt && (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-4 py-2.5 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" />
          آخر حفظ: {savedAt.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar tabs */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-1 rounded-2xl border border-border bg-surface p-3">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-4">
          {activeTab === "hero" && <HeroTab cfg={local.hero} onChange={(v) => handleChange("hero", v)} />}
          {activeTab === "sections" && <SectionsTab cfg={local.sections} onChange={(v) => handleChange("sections", v)} />}
          {activeTab === "theme" && <ThemeTab cfg={local.theme} onChange={(v) => handleChange("theme", v)} />}
          {activeTab === "products" && <ProductsTab cfg={local.products_layout} onChange={(v) => handleChange("products_layout", v)} />}
          {activeTab === "product_page" && <ProductPageTab cfg={local.product_page} onChange={(v) => handleChange("product_page", v)} />}
          {activeTab === "cart" && <CartTab cfg={local.cart_config} onChange={(v) => handleChange("cart_config", v)} />}
          {activeTab === "navigation" && <NavigationTab cfg={local.navigation} onChange={(v) => handleChange("navigation", v)} />}
          {activeTab === "seo" && <SeoTab cfg={local.seo} onChange={(v) => handleChange("seo", v)} />}
          {activeTab === "advanced" && <AdvancedTab cfg={local.advanced} onChange={(v) => handleChange("advanced", v)} />}
        </div>
      </div>

      {/* Change logs */}
      <ChangeLogsPanel />

      {/* Sticky Footer */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <p className="min-w-0 text-xs text-muted-foreground">
            <FileText className="inline h-3 w-3 me-1" />
            التبويب الحالي: <span className="font-bold text-foreground">{TABS.find((t) => t.id === activeTab)?.label}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => saveMut.mutate()}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10 transition disabled:opacity-60"
            >
              {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              حفظ هذا التبويب
            </button>
            <button
              type="button"
              onClick={() => saveAllMut.mutate()}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-brand transition disabled:opacity-60"
            >
              {saveAllMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              نشر جميع الإعدادات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
