import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  HelpCircle,
  TrendingUp,
  EyeIcon,
  ShoppingCartIcon,
  Sparkles,
  Lock,
  Languages,
  ShieldCheck,
  Code,
  Laptop,
  Tablet as TabletIcon,
  Smartphone,
} from "lucide-react";
import {
  getStorefrontAppearance,
  saveStorefrontDraft,
  updateStorefrontAppearance,
  getStorefrontChangeLogs,
  restoreStorefrontVersion,
  type ChangeLogEntry,
} from "@/lib/actions/appearance.actions";
import { notifyStorefrontPublished } from "@/components/appearance-provider";
import {
  DEFAULT_STOREFRONT_SETTINGS,
  type StorefrontSettingsShape,
  type SectionsConfig,
  type HeroConfig,
  type ThemeConfig,
  type ProductsLayoutConfig,
  type ProductPageConfig,
  type CartConfig,
  type CheckoutConfig,
  type NavigationConfig,
  type PagesConfig,
  type TranslationConfig,
  type NotificationsConfig,
  type SeoConfig,
  type AdvancedConfig,
  type CustomPage,
} from "@/lib/domain/appearance";

export const Route = createFileRoute("/admin/storefront")({
  component: StorefrontCMSPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId =
  | "homepage"
  | "theme"
  | "catalog"
  | "checkout"
  | "navigation"
  | "content"
  | "notifications"
  | "studio";

const TABS: Array<{ id: TabId; label: string; icon: typeof Layout }> = [
  { id: "homepage", label: "الرئيسية والبنرات", icon: MonitorPlay },
  { id: "theme", label: "المظهر والثيم", icon: Palette },
  { id: "catalog", label: "المنتجات والمعرض", icon: Grid3X3 },
  { id: "checkout", label: "السلة والدفع", icon: ShoppingCart },
  { id: "navigation", label: "الهيدر والقوائم", icon: Navigation },
  { id: "content", label: "الصفحات والترجمة", icon: FileText },
  { id: "notifications", label: "الإشعارات و SEO", icon: Search },
  { id: "studio", label: "استوديو التحليلات", icon: Sliders },
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
    <span className="block text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1 font-sans">
      {children}
      {required && <span className="text-destructive ms-0.5">*</span>}
    </span>
  );
}

const fieldCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition mt-1 font-sans text-foreground";

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
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition font-sans ${
        checked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
      }`}
    >
      {checked ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
      {checked ? "مفعّل" : "معطّل"}
    </button>
  );
}

function SectionCard({ title, children, badge }: { title: string; children: React.ReactNode; badge?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="text-sm font-bold text-foreground font-sans">{title}</h3>
        {badge && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold font-mono">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function ImageUploader({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (base64: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
      toast.success("تم رفع الصورة بنجاح! 📸");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1">
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
      <div className="relative flex items-center justify-between gap-4 rounded-xl border border-dashed border-border bg-background/50 p-4 transition-all hover:bg-background">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        {value ? (
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={value} alt="Preview" className="h-12 w-12 rounded-lg object-cover ring-1 ring-border" />
              <div className="text-right">
                <p className="text-xs font-black text-success">تم تحميل الصورة من الهاتف</p>
                <p className="text-[10px] text-muted-foreground">صيغة قاعدة البيانات (Base64)</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition"
              >
                تغيير
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-lg bg-destructive/10 px-2 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition"
              >
                حذف
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center py-2 text-center text-muted-foreground transition hover:text-foreground"
          >
            <Upload className="h-6 w-6 text-primary mb-1" />
            <span className="text-xs font-black">اضغط لاختيار صورة من هاتفك</span>
            <span className="text-[10px] text-muted-foreground/80 mt-0.5 font-sans">صورة الشعار أو البنر</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Live Preview Viewer Component (Phase C) ──────────────────────────────────
function LivePreviewDevice({
  local,
  viewport,
}: {
  local: StorefrontSettingsShape;
  viewport: "desktop" | "tablet" | "mobile";
}) {
  const t = local.theme;
  const nav = local.navigation;
  const hero = local.hero;
  const layout = local.products_layout;
  const notif = local.notifications;
  const trans = local.translation;

  // Visual simulation values based on settings colors
  const previewStyles = {
    "--primary": t.primaryColor,
    "--secondary": t.secondaryColor,
    "--bg": t.backgroundColor,
    "--surface": t.surfaceColor,
    "--text": t.textColor,
    "--border": t.borderColor,
    fontFamily: t.fontFamily === "Tajawal" ? "'Tajawal', sans-serif" : t.fontFamily === "Cairo" ? "'Cairo', sans-serif" : "Inter, sans-serif",
  } as React.CSSProperties;

  const mockProducts = [
    { id: "1", name: "منتج تجريبي فاخر A", price: "24,000", discount: "20%", rating: 4.8, isNew: true },
    { id: "2", name: "سماعة ذكية عصرية", price: "18,000", discount: null, rating: 4.5, isNew: false },
    { id: "3", name: "كاميرا عاكسة احترافية", price: "120,000", discount: "15%", rating: 4.9, isNew: true },
    { id: "4", name: "ساعة ذكية رياضية 3D", price: "35,000", discount: null, rating: 4.2, isNew: false },
  ];

  const content = (
    <div
      style={previewStyles}
      className="w-full h-full bg-[var(--bg)] text-[var(--text)] overflow-y-auto scrollbar-thin transition-colors duration-300 select-none flex flex-col font-sans"
      dir="rtl"
    >
      {/* Announcement Bar */}
      {notif.announcementEnabled && (
        <div
          style={{ backgroundColor: notif.announcementBg }}
          className="text-white text-[10px] font-bold py-1.5 px-4 text-center truncate shadow-sm shrink-0"
        >
          {notif.announcementText}
        </div>
      )}

      {/* Header */}
      <header className="px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {nav.logoUrl ? (
            <img src={nav.logoUrl} alt="Logo" className="h-6 w-auto object-contain rounded" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-black text-xs">N</div>
          )}
          <div>
            <h4 className="text-xs font-black truncate max-w-[120px]">{nav.storeName}</h4>
            <p className="text-[8px] text-muted-foreground truncate max-w-[100px]">{nav.tagline}</p>
          </div>
        </div>

        {/* Header navigation links */}
        {viewport !== "mobile" && (
          <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
            {nav.headerLinks.filter(l => l.visible).slice(0, 4).map((link, idx) => (
              <span key={idx} className="hover:text-[var(--text)] transition cursor-pointer">{link.label}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="relative">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <span className="absolute -top-1.5 -left-1.5 bg-primary text-white text-[8px] h-3.5 w-3.5 rounded-full flex items-center justify-center font-bold font-mono scale-90">2</span>
          </div>
        </div>
      </header>

      {/* Main content viewport wrapper */}
      <div className="flex-1 space-y-4 pb-8">
        {/* Dynamic Hero Section */}
        {hero.enabled && (
          <div className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-transparent px-4 py-8 border-b border-[var(--border)] text-center">
            {hero.type === "sphere_3d" ? (
              <div className="space-y-3">
                <span className="text-[8px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{hero.badgeText}</span>
                <h2 className="text-sm font-black leading-tight">{hero.title}</h2>
                <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">{hero.subtitle}</p>

                {/* Rotating Sphere Simulation */}
                <div className="relative h-28 w-28 mx-auto flex items-center justify-center border border-dashed border-primary/20 rounded-full animate-[spin_10s_linear_infinite] mt-4">
                  {/* Particles */}
                  {hero.showParticles && (
                    <div className="absolute inset-0 rounded-full border border-dotted border-secondary/20 scale-75 animate-[spin_6s_linear_infinite_reverse]"></div>
                  )}
                  {/* Floating product card face dots */}
                  <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-ping"></div>
                  <div className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-secondary animate-pulse"></div>
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 h-4 w-4 rounded-full bg-primary/30 flex items-center justify-center text-[7px] font-bold">🛒</div>

                  {/* Dynamic shaped cards mock */}
                  <div className={`h-12 w-12 border border-primary/50 bg-[var(--surface)] shadow-lg flex flex-col items-center justify-center text-center p-1 ${
                    hero.sphereCardShape === "circle" ? "rounded-full" : "rounded"
                  }`}>
                    <span className="text-[6px] font-bold truncate w-full text-[var(--text)]">مكعب ثلاثي</span>
                    <span className="text-[5px] text-primary font-bold">120 ر.ي</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                <span className="text-[8px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">{hero.badgeText}</span>
                <h2 className="text-sm font-black">{hero.title}</h2>
                <p className="text-[10px] text-muted-foreground">{hero.subtitle}</p>
                <button
                  type="button"
                  style={{ borderRadius: t.buttonStyle === "pill" ? "9999px" : t.buttonStyle === "rounded" ? "8px" : "0px" }}
                  className="bg-primary text-white text-[9px] font-bold px-4 py-1.5 mt-2 shadow hover:opacity-90"
                >
                  {hero.ctaText}
                </button>
              </div>
            )}
          </div>
        )}

        {/* reordered sections */}
        <div className="px-4 space-y-4">
          {local.sections.sectionOrder.filter(k => {
            if (k === "sectionOrder") return false;
            const sec = local.sections[k as keyof Omit<SectionsConfig, "sectionOrder">];
            return sec && typeof sec === "object" && "enabled" in sec ? (sec as any).enabled !== false : true;
          }).map((key) => {
            if (key === "latest") {
              const columns = viewport === "mobile" ? layout.columnsMobile : viewport === "tablet" ? layout.columnsTablet : layout.columnsDesktop;
              return (
                <div key={key} className="space-y-2">
                  <h3 className="text-xs font-bold border-r-2 border-primary pr-1.5">{local.sections.latest.title || "أحدث المنتجات"}</h3>
                  <div
                    style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                    className="grid gap-2"
                  >
                    {mockProducts.slice(0, columns * 2).map((prod) => (
                      <div
                        key={prod.id}
                        className={`border border-[var(--border)] bg-[var(--surface)] p-2 flex flex-col justify-between transition relative overflow-hidden ${
                          t.cardStyle === "glass" ? "backdrop-blur bg-opacity-70" : ""
                        } ${
                          t.borderRadius === "large" ? "rounded-xl" : t.borderRadius === "rounded" ? "rounded-md" : "rounded-none"
                        } ${
                          layout.hoverEffect === "glow" ? "hover:shadow-[0_0_8px_rgba(79,140,255,0.4)]" : "hover:scale-[1.02]"
                        }`}
                      >
                        {layout.showImage && (
                          <div className="h-16 w-full rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary/40 mb-1.5">
                            صورة المنتج
                          </div>
                        )}
                        <div>
                          <h4 className="text-[10px] font-bold truncate">{prod.name}</h4>
                          {layout.showRating && (
                            <span className="text-[8px] text-yellow-400">★ {prod.rating}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          {layout.showPrice && (
                            <span className="text-[9px] font-black text-primary">{prod.price} ر.ي</span>
                          )}
                          {layout.showAddToCartButton && (
                            <button
                              type="button"
                              className="text-[8px] bg-primary text-white font-bold p-1 rounded hover:opacity-90 shrink-0"
                            >
                              {trans.addToCart}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            if (key === "categories") {
              return (
                <div key={key} className="space-y-2">
                  <h3 className="text-xs font-bold border-r-2 border-primary pr-1.5">{local.sections.categories.title || "التصنيفات"}</h3>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {["إلكترونيات", "سماعات", "شواحن", "كاميرات", "ساعات"].map((cat, i) => (
                      <span key={i} className="text-[9px] bg-[var(--surface)] border border-[var(--border)] px-3 py-1 rounded-full shrink-0">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto px-4 py-4 bg-[var(--surface)] border-t border-[var(--border)] space-y-2 text-[8px] text-muted-foreground shrink-0 text-center">
        <p className="max-w-[200px] mx-auto text-center">{nav.footerDescription}</p>
        <p className="border-t border-[var(--border)] pt-2 font-mono">
          {nav.copyrightText} © {new Date().getFullYear()} {nav.storeName}
        </p>
      </footer>
    </div>
  );

  // Render viewport devices mockup
  if (viewport === "mobile") {
    return (
      <div className="relative mx-auto w-[280px] h-[520px] rounded-[32px] border-[8px] border-slate-800 shadow-2xl bg-[#06091f] overflow-hidden flex flex-col">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-800 rounded-b-xl z-50 flex items-center justify-center">
          <div className="h-1 w-8 bg-slate-700 rounded-full"></div>
        </div>
        {content}
      </div>
    );
  }

  if (viewport === "tablet") {
    return (
      <div className="relative mx-auto w-full max-w-[420px] h-[520px] rounded-2xl border-[6px] border-slate-700 shadow-2xl bg-[#06091f] overflow-hidden flex flex-col">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full h-[520px] rounded-xl border border-border shadow-xl bg-[#06091f] overflow-hidden flex flex-col">
      {content}
    </div>
  );
}

// ── 01. Homepage Builder Tab ──────────────────────────────────────────────────
interface HomepageTabProps {
  hero: HeroConfig;
  sections: SectionsConfig;
  onHeroChange: (v: HeroConfig) => void;
  onSectionsChange: (v: SectionsConfig) => void;
}
function HomepageTab({
  hero,
  sections,
  onHeroChange,
  onSectionsChange,
}: HomepageTabProps) {
  const setHero = <K extends keyof HeroConfig>(k: K, v: HeroConfig[K]) =>
    onHeroChange({ ...hero, [k]: v });

  const moveSection = (index: number, direction: "up" | "down") => {
    const order = [...sections.sectionOrder];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= order.length) return;
    [order[index], order[newIndex]] = [order[newIndex], order[index]];
    onSectionsChange({ ...sections, sectionOrder: order });
  };

  const toggleSection = (key: string) => {
    const sectionKey = key as keyof SectionsConfig;
    const section = sections[sectionKey] as { enabled: boolean } | undefined;
    if (!section || typeof section !== "object") return;
    onSectionsChange({ ...sections, [sectionKey]: { ...section, enabled: !section.enabled } });
  };

  const isSectionEnabled = (key: string): boolean => {
    const sectionKey = key as keyof SectionsConfig;
    const section = sections[sectionKey];
    if (section && typeof section === "object" && "enabled" in section) {
      return (section as { enabled: boolean }).enabled;
    }
    return true;
  };

  return (
    <div className="space-y-4">
      {/* Hero Style */}
      <SectionCard title="البنر الرئيسي والبنر ثلاثي الأبعاد" badge="Banner Manager">
        <Field label="نوع الهيرو الرئيسي">
          <select value={hero.type} onChange={(e) => setHero("type", e.target.value as HeroConfig["type"])} className={fieldCls}>
            <option value="sphere_3d">🌍 كرة المنتجات ثلاثية الأبعاد</option>
            <option value="banner_image">🖼️ صورة بنر ثابت</option>
            <option value="video">🎬 فيديو بنر</option>
            <option value="slideshow">🎠 عروض شرائح (Slideshow)</option>
            <option value="cinematic">🎭 عرض سينمائي ممتد</option>
          </select>
        </Field>
        {hero.type === "banner_image" && (
          <ImageUploader
            label="صورة البنر الرئيسي"
            value={hero.bannerImageUrl}
            onChange={(val) => setHero("bannerImageUrl", val)}
          />
        )}
        {hero.type === "video" && (
          <Field label="رابط فيديو البنر">
            <input value={hero.bannerVideoUrl} onChange={(e) => setHero("bannerVideoUrl", e.target.value)} className={fieldCls} placeholder="مثال: https://..." dir="ltr" />
          </Field>
        )}
        {hero.type === "slideshow" && (
          <div className="space-y-3 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">شرائح عرض الصور (Slideshow)</span>
              <button
                type="button"
                onClick={() => {
                  const newSlide = {
                    id: Math.random().toString(),
                    mediaType: "image" as const,
                    mediaUrl: "",
                    badgeText: "جديد",
                    title: "شريحة جديدة",
                    subtitle: "وصف الشريحة",
                    ctaText: "تصفح الآن",
                    ctaLink: "/",
                    order: hero.slides.length + 1,
                  };
                  setHero("slides", [...hero.slides, newSlide]);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition"
              >
                <Plus className="h-3 w-3" />
                إضافة شريحة
              </button>
            </div>
            {hero.slides.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4 bg-background/50 rounded-xl">لا توجد شرائح مضافة حالياً</p>
            ) : (
              <div className="space-y-3">
                {hero.slides.map((slide, idx) => (
                  <div key={slide.id || idx} className="rounded-xl border border-border bg-background/30 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">الشريحة #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = hero.slides.filter((_, sIdx) => sIdx !== idx);
                          setHero("slides", updated);
                        }}
                        className="text-xs text-destructive hover:underline"
                      >
                        حذف
                      </button>
                    </div>
                    <ImageUploader
                      label="صورة الشريحة"
                      value={slide.mediaUrl}
                      onChange={(val) => {
                        const updated = [...hero.slides];
                        updated[idx] = { ...updated[idx], mediaUrl: val };
                        setHero("slides", updated);
                      }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="شارة الشريحة">
                        <input
                          value={slide.badgeText}
                          onChange={(e) => {
                            const updated = [...hero.slides];
                            updated[idx] = { ...updated[idx], badgeText: e.target.value };
                            setHero("slides", updated);
                          }}
                          className={fieldCls}
                        />
                      </Field>
                      <Field label="عنوان الشريحة">
                        <input
                          value={slide.title}
                          onChange={(e) => {
                            const updated = [...hero.slides];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            setHero("slides", updated);
                          }}
                          className={fieldCls}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between pt-2">
          <Label>تفعيل البنر الرئيسي</Label>
          <Toggle checked={hero.enabled} onChange={(v) => setHero("enabled", v)} />
        </div>
      </SectionCard>

      {/* Hero Content */}
      <SectionCard title="نصوص البنر الرئيسي">
        <Field label="نص الشارة (Badge Text)">
          <input value={hero.badgeText} onChange={(e) => setHero("badgeText", e.target.value)} className={fieldCls} placeholder="مثال: INDEXES · LIVE SHOWCASE" />
        </Field>
        <Field label="العنوان الرئيسي">
          <input value={hero.title} onChange={(e) => setHero("title", e.target.value)} className={fieldCls} />
        </Field>
        <Field label="العنوان الفرعي">
          <input value={hero.subtitle} onChange={(e) => setHero("subtitle", e.target.value)} className={fieldCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="نص زر CTA الرئيسي">
            <input value={hero.ctaText} onChange={(e) => setHero("ctaText", e.target.value)} className={fieldCls} />
          </Field>
          <Field label="رابط زر CTA">
            <input value={hero.ctaLink} onChange={(e) => setHero("ctaLink", e.target.value)} className={fieldCls} dir="ltr" />
          </Field>
        </div>
      </SectionCard>

      {/* 3D Sphere controls */}
      {hero.type === "sphere_3d" && (
        <SectionCard title="إعدادات الكرة ثلاثية الأبعاد">
          <div className="grid grid-cols-2 gap-3">
            <Field label="عدد المنتجات في الكرة">
              <input type="number" min={6} max={120} value={hero.sphereMaxProducts} onChange={(e) => setHero("sphereMaxProducts", Number(e.target.value))} className={fieldCls} dir="ltr" />
            </Field>
            <Field label="نصف قطر الكرة">
              <input type="number" min={1} max={5} step={0.1} value={hero.sphereRadius} onChange={(e) => setHero("sphereRadius", Number(e.target.value))} className={fieldCls} dir="ltr" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="حجم البطاقات داخل الكرة">
              <input type="number" min={0.2} max={2} step={0.1} value={hero.sphereTileScale} onChange={(e) => setHero("sphereTileScale", Number(e.target.value))} className={fieldCls} dir="ltr" />
            </Field>
            <Field label="شكل بطاقات المنتجات">
              <select value={hero.sphereCardShape} onChange={(e) => setHero("sphereCardShape", e.target.value as "rectangle" | "circle")} className={fieldCls}>
                <option value="rectangle">مستطيل</option>
                <option value="circle">دائري (جميل وناعم)</option>
              </select>
            </Field>
          </div>
          <Field label="مصدر منتجات الكرة">
            <select value={hero.sphereProductSource || "all"} onChange={(e) => setHero("sphereProductSource", e.target.value as HeroConfig["sphereProductSource"])} className={fieldCls}>
              <option value="all">📦 جميع المنتجات المتوفرة</option>
              <option value="bestsellers">⭐ المنتجات الأكثر مبيعاً</option>
              <option value="offers">🔥 منتجات قسم العروض والخصومات</option>
            </select>
          </Field>
          <div className="flex flex-wrap gap-4 mt-2 pt-2 border-t border-border/40">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-bold font-sans">عرض الاسم</span>
              <Toggle checked={hero.sphereShowName} onChange={(v) => setHero("sphereShowName", v)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-bold font-sans">عرض السعر</span>
              <Toggle checked={hero.sphereShowPrice} onChange={(v) => setHero("sphereShowPrice", v)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-bold font-sans">تأثير الجسيمات الخلفية</span>
              <Toggle checked={hero.showParticles} onChange={(v) => setHero("showParticles", v)} />
            </div>
          </div>
        </SectionCard>
      )}

      {/* Sections Order */}
      <SectionCard title="ترتيب أقسام الصفحة الرئيسية" badge="Homepage Builder">
        <p className="text-xs text-muted-foreground">استخدم الأسهم لتغيير ترتيب ظهور الأقسام على الصفحة الرئيسية للعميل:</p>
        <div className="space-y-2 mt-2">
          {sections.sectionOrder.map((key, index) => (
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
                  disabled={index === sections.sectionOrder.length - 1}
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

      {/* Section Titles & Limits Editor */}
      <SectionCard title="عناوين وحدود عرض الأقسام" badge="Section Titles">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl border border-border bg-background/40">
            <div className="col-span-2">
              <Field label="عنوان قسم أحدث المنتجات">
                <input value={sections.latest.title} onChange={(e) => onSectionsChange({ ...sections, latest: { ...sections.latest, title: e.target.value } })} className={fieldCls} placeholder="أحدث المنتجات" />
              </Field>
            </div>
            <Field label="العدد الأقصى">
              <input type="number" min={4} max={48} value={sections.latest.limit} onChange={(e) => onSectionsChange({ ...sections, latest: { ...sections.latest, limit: Number(e.target.value) } })} className={fieldCls} dir="ltr" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl border border-border bg-background/40">
            <div className="col-span-2">
              <Field label="عنوان قسم عروض اليوم 🔥">
                <input value={sections.deals.title} onChange={(e) => onSectionsChange({ ...sections, deals: { ...sections.deals, title: e.target.value } })} className={fieldCls} placeholder="عروض اليوم 🔥" />
              </Field>
            </div>
            <Field label="العدد الأقصى">
              <input type="number" min={2} max={24} value={sections.deals.limit} onChange={(e) => onSectionsChange({ ...sections, deals: { ...sections.deals, limit: Number(e.target.value) } })} className={fieldCls} dir="ltr" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl border border-border bg-background/40">
            <div className="col-span-2">
              <Field label="عنوان قسم الأكثر مبيعاً ⭐">
                <input value={sections.recommended.title} onChange={(e) => onSectionsChange({ ...sections, recommended: { ...sections.recommended, title: e.target.value } })} className={fieldCls} placeholder="الأكثر مبيعاً" />
              </Field>
            </div>
            <Field label="العدد الأقصى">
              <input type="number" min={2} max={24} value={sections.recommended.limit} onChange={(e) => onSectionsChange({ ...sections, recommended: { ...sections.recommended, limit: Number(e.target.value) } })} className={fieldCls} dir="ltr" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl border border-border bg-background/40">
            <div className="col-span-2">
              <Field label="عنوان قسم التصنيفات">
                <input value={sections.categories.title} onChange={(e) => onSectionsChange({ ...sections, categories: { ...sections.categories, title: e.target.value } })} className={fieldCls} placeholder="التصنيفات" />
              </Field>
            </div>
            <Field label="العدد الأقصى">
              <input type="number" min={2} max={16} value={sections.categories.limit} onChange={(e) => onSectionsChange({ ...sections, categories: { ...sections.categories, limit: Number(e.target.value) } })} className={fieldCls} dir="ltr" />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* Cinematic section */}
      {isSectionEnabled("cinematic") && (
        <SectionCard title="إعدادات العرض السينمائي" badge="Cinematic Story">
          <Field label="عنوان العرض السينمائي">
            <input value={sections.cinematic.title} onChange={(e) => onSectionsChange({ ...sections, cinematic: { ...sections.cinematic, title: e.target.value } })} className={fieldCls} />
          </Field>
          <Field label="العنوان الفرعي">
            <input value={sections.cinematic.subtitle} onChange={(e) => onSectionsChange({ ...sections, cinematic: { ...sections.cinematic, subtitle: e.target.value } })} className={fieldCls} />
          </Field>
          <Field label="رابط فيديو الخلفية">
            <input value={sections.cinematic.videoUrl} onChange={(e) => onSectionsChange({ ...sections, cinematic: { ...sections.cinematic, videoUrl: e.target.value } })} className={fieldCls} placeholder="https://..." dir="ltr" />
          </Field>
          <ImageUploader
            label="صورة الغلاف الاحتياطية (Poster Image)"
            value={sections.cinematic.posterUrl}
            onChange={(val) => onSectionsChange({ ...sections, cinematic: { ...sections.cinematic, posterUrl: val } })}
          />
        </SectionCard>
      )}

      {/* Widgets & Blocks Engine */}
      <SectionCard title="محرك الـ Widgets / الكتل المخصصة" badge="Blocks Engine">
        <div className="rounded-xl border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">شارات الثقة والضمانات</span>
            <Toggle checked={sections.trustBadges.enabled} onChange={(v) => onSectionsChange({ ...sections, trustBadges: { ...sections.trustBadges, enabled: v } })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="شارة 1">
              <input value={sections.trustBadges.badge1} onChange={(e) => onSectionsChange({ ...sections, trustBadges: { ...sections.trustBadges, badge1: e.target.value } })} className={fieldCls} />
            </Field>
            <Field label="شارة 2">
              <input value={sections.trustBadges.badge2} onChange={(e) => onSectionsChange({ ...sections, trustBadges: { ...sections.trustBadges, badge2: e.target.value } })} className={fieldCls} />
            </Field>
            <Field label="شارة 3">
              <input value={sections.trustBadges.badge3} onChange={(e) => onSectionsChange({ ...sections, trustBadges: { ...sections.trustBadges, badge3: e.target.value } })} className={fieldCls} />
            </Field>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ── 02. Theme Builder Tab ─────────────────────────────────────────────────────
function ThemeTab({ cfg, onChange }: { cfg: ThemeConfig; onChange: (v: ThemeConfig) => void }) {
  const set = <K extends keyof ThemeConfig>(k: K, v: ThemeConfig[K]) =>
    onChange({ ...cfg, [k]: v });

  return (
    <div className="space-y-4">
      <SectionCard title="ألوان الثيم والهوية البصرية" badge="Theme Builder">
        <div className="grid grid-cols-2 gap-4">
          <Field label="اللون الأساسي (Primary)">
            <div className="flex gap-2 mt-1">
              <input type="color" value={cfg.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-background p-0.5" />
              <input value={cfg.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className={`${fieldCls} !mt-0 font-mono text-xs`} dir="ltr" />
            </div>
          </Field>
          <Field label="اللون الثانوي (Secondary)">
            <div className="flex gap-2 mt-1">
              <input type="color" value={cfg.secondaryColor} onChange={(e) => set("secondaryColor", e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-background p-0.5" />
              <input value={cfg.secondaryColor} onChange={(e) => set("secondaryColor", e.target.value)} className={`${fieldCls} !mt-0 font-mono text-xs`} dir="ltr" />
            </div>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="لون خلفية الموقع">
            <div className="flex gap-2 mt-1">
              <input type="color" value={cfg.backgroundColor} onChange={(e) => set("backgroundColor", e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-background p-0.5" />
              <input value={cfg.backgroundColor} onChange={(e) => set("backgroundColor", e.target.value)} className={`${fieldCls} !mt-0 font-mono text-xs`} dir="ltr" />
            </div>
          </Field>
          <Field label="لون الأسطح والبطاقات">
            <div className="flex gap-2 mt-1">
              <input type="color" value={cfg.surfaceColor} onChange={(e) => set("surfaceColor", e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-background p-0.5" />
              <input value={cfg.surfaceColor} onChange={(e) => set("surfaceColor", e.target.value)} className={`${fieldCls} !mt-0 font-mono text-xs`} dir="ltr" />
            </div>
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="الخط والوضع">
        <div className="grid grid-cols-2 gap-3">
          <Field label="نوع الخط العربي الرئيسي">
            <select value={cfg.fontFamily} onChange={(e) => set("fontFamily", e.target.value as ThemeConfig["fontFamily"])} className={fieldCls}>
              <option value="Tajawal">Tajawal (افتراضي وناعم)</option>
              <option value="Cairo">Cairo (رسمي وجريء)</option>
              <option value="Inter">Inter (إنجليزي مودرن)</option>
            </select>
          </Field>
          <Field label="وضع العرض الافتراضي">
            <select value={cfg.defaultMode} onChange={(e) => set("defaultMode", e.target.value as ThemeConfig["defaultMode"])} className={fieldCls}>
              <option value="dark">داكن فاخر 🌙</option>
              <option value="light">فاتح هادئ ☀️</option>
              <option value="system">حسب إعدادات جهاز العميل</option>
            </select>
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="التصميم والرسوم">
        <div className="grid grid-cols-3 gap-3">
          <Field label="انحناء حواف الأزرار والبطاقات">
            <select value={cfg.borderRadius} onChange={(e) => set("borderRadius", e.target.value as ThemeConfig["borderRadius"])} className={fieldCls}>
              <option value="sharp">Sharp (حاد)</option>
              <option value="rounded">Rounded (خفيف)</option>
              <option value="large">Large (دائري واسع)</option>
            </select>
          </Field>
          <Field label="ستايل البطاقات">
            <select value={cfg.cardStyle} onChange={(e) => set("cardStyle", e.target.value as ThemeConfig["cardStyle"])} className={fieldCls}>
              <option value="glass">زجاجي شفاف (Glassmorphism)</option>
              <option value="solid">صلب معتم</option>
              <option value="bordered">محدد بإطار فقط</option>
            </select>
          </Field>
          <Field label="شكل الأزرار">
            <select value={cfg.buttonStyle} onChange={(e) => set("buttonStyle", e.target.value as ThemeConfig["buttonStyle"])} className={fieldCls}>
              <option value="pill">Pill (كبسولة دائرية)</option>
              <option value="rounded">Rounded (حواف مستديرة)</option>
              <option value="square">Square (مربع حاد)</option>
            </select>
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}

// ── 03. Catalog & Products Tab ────────────────────────────────────────────────
interface CatalogTabProps {
  layout: ProductsLayoutConfig;
  page: ProductPageConfig;
  onLayoutChange: (v: ProductsLayoutConfig) => void;
  onPageChange: (v: ProductPageConfig) => void;
}
function CatalogTab({
  layout,
  page,
  onLayoutChange,
  onPageChange,
}: CatalogTabProps) {
  const setLay = <K extends keyof ProductsLayoutConfig>(k: K, v: ProductsLayoutConfig[K]) =>
    onLayoutChange({ ...layout, [k]: v });

  const setPage = <K extends keyof ProductPageConfig>(k: K, v: ProductPageConfig[K]) =>
    onPageChange({ ...page, [k]: v });

  return (
    <div className="space-y-4">
      {/* Product Layout */}
      <SectionCard title="تخطيط شبكة المنتجات (بناء شبكة المنتجات)" badge="Product Layout">
        <div className="grid grid-cols-3 gap-3">
          <Field label="أعمدة (شاشات الكمبيوتر)">
            <input type="number" min={2} max={6} value={layout.columnsDesktop} onChange={(e) => setLay("columnsDesktop", Number(e.target.value))} className={fieldCls} dir="ltr" />
          </Field>
          <Field label="أعمدة (التابلت)">
            <input type="number" min={1} max={4} value={layout.columnsTablet} onChange={(e) => setLay("columnsTablet", Number(e.target.value))} className={fieldCls} dir="ltr" />
          </Field>
          <Field label="أعمدة (الهواتف)">
            <input type="number" min={1} max={2} value={layout.columnsMobile} onChange={(e) => setLay("columnsMobile", Number(e.target.value))} className={fieldCls} dir="ltr" />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-2">
          <Field label="نسبة الصورة">
            <select value={layout.aspectRatio} onChange={(e) => setLay("aspectRatio", e.target.value as ProductsLayoutConfig["aspectRatio"])} className={fieldCls}>
              <option value="square">1:1 مربع</option>
              <option value="portrait">3:4 طولي</option>
              <option value="video">16:9 عريض</option>
            </select>
          </Field>
          <Field label="تأثير عند تمرير الماوس">
            <select value={layout.hoverEffect} onChange={(e) => setLay("hoverEffect", e.target.value as ProductsLayoutConfig["hoverEffect"])} className={fieldCls}>
              <option value="scale">تكبير خفيف (Scale)</option>
              <option value="glow">توهج إضاءة (Glow)</option>
              <option value="none">بدون تأثير</option>
            </select>
          </Field>
          <Field label="ستايل التنقل بين الصفحات">
            <select value={layout.paginationStyle} onChange={(e) => setLay("paginationStyle", e.target.value as ProductsLayoutConfig["paginationStyle"])} className={fieldCls}>
              <option value="infinite">تحميل لا نهائي (Infinite)</option>
              <option value="pages">أرقام صفحات كلاسيكية</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border mt-3">
          {(
            [
              { key: "showImage", label: "عرض الصورة" },
              { key: "showPrice", label: "عرض السعر" },
              { key: "showDiscount", label: "شارة الخصم" },
              { key: "showRating", label: "التقييم بالنجوم" },
              { key: "showStock", label: "حالة المخزون" },
              { key: "showAddToCartButton", label: "زر السلة السريع" },
              { key: "showWaBtn", label: "زر واتساب" },
              { key: "showWishlist", label: "أيقونة المفضلة" },
            ] as const
          ).map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-xs font-bold">{item.label}</span>
              <Toggle checked={Boolean(layout[item.key])} onChange={(v) => setLay(item.key, v)} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Product Page Builder */}
      <SectionCard title="عناصر صفحة تفاصيل المنتج" badge="Product Page Builder">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { key: "showImages", label: "معرض الصور" },
              { key: "showVideo", label: "فيديو المنتج" },
              { key: "show3DModel", label: "تفعيل موديل 3D" },
              { key: "showDescription", label: "الوصف التفصيلي" },
              { key: "showWaBtn", label: "زر الطلب السريع واتساب" },
              { key: "showCartBtn", label: "زر الإضافة للسلة" },
              { key: "showRelatedProducts", label: "منتجات مشابهة" },
              { key: "showRecommendedProducts", label: "مقترحات قد تعجبك" },
            ] as const
          ).map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-xs font-bold">{item.label}</span>
              <Toggle checked={Boolean(page[item.key])} onChange={(v) => setPage(item.key, v)} />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ── 04. Checkout & Cart Tab ───────────────────────────────────────────────────
interface CheckoutTabProps {
  cart: CartConfig;
  checkout: CheckoutConfig;
  onCartChange: (v: CartConfig) => void;
  onCheckoutChange: (v: CheckoutConfig) => void;
}
function CheckoutTab({
  cart,
  checkout,
  onCartChange,
  onCheckoutChange,
}: CheckoutTabProps) {
  const setCart = <K extends keyof CartConfig>(k: K, v: CartConfig[K]) =>
    onCartChange({ ...cart, [k]: v });

  const setCheck = <K extends keyof CheckoutConfig>(k: K, v: CheckoutConfig[K]) =>
    onCheckoutChange({ ...checkout, [k]: v });

  const [newCity, setNewCity] = useState("");
  const [newRate, setNewRate] = useState(0);

  const addShippingRate = () => {
    if (!newCity.trim()) return;
    const rates = [...checkout.shippingRates, { city: newCity.trim(), rate: newRate }];
    setCheck("shippingRates", rates);
    setNewCity("");
    setNewRate(0);
  };

  const removeShippingRate = (idx: number) => {
    const rates = checkout.shippingRates.filter((_, i) => i !== idx);
    setCheck("shippingRates", rates);
  };

  return (
    <div className="space-y-4">
      {/* Cart Builder */}
      <SectionCard title="إعدادات وتصميم سلة التسوق والواتساب" badge="Cart Builder">
        <div className="grid grid-cols-2 gap-3">
          <Field label="شكل السلة">
            <select value={cart.cartStyle} onChange={(e) => setCart("cartStyle", e.target.value as CartConfig["cartStyle"])} className={fieldCls}>
              <option value="drawer">جانبية منزلقة (Drawer)</option>
              <option value="page">صفحة كاملة مستقلة</option>
              <option value="modal">نافذة منبثقة (Modal)</option>
            </select>
          </Field>
          <Field label="موضع زر السلة العائم">
            <select value={cart.floatingBarPosition} onChange={(e) => setCart("floatingBarPosition", e.target.value as CartConfig["floatingBarPosition"])} className={fieldCls}>
              <option value="bottom">أسفل الشاشة (افتراضي للهواتف)</option>
              <option value="top">أعلى الشاشة</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <Field label="رقم واتساب استقبال الطلبات">
            <input value={cart.whatsappPhone} onChange={(e) => setCart("whatsappPhone", e.target.value)} className={fieldCls} placeholder="967771370740" dir="ltr" />
          </Field>
          <Field label="حد الشحن المجاني (0 = معطّل)">
            <input type="number" min={0} value={cart.freeShippingThreshold} onChange={(e) => setCart("freeShippingThreshold", Number(e.target.value))} className={fieldCls} dir="ltr" placeholder="مثال: 50000" />
          </Field>
        </div>

        <Field label="قالب رسالة طلب الواتساب (تستخدم متغيرات: {products}, {total}, {name}, {address})">
          <textarea value={cart.whatsappOrderTemplate} onChange={(e) => setCart("whatsappOrderTemplate", e.target.value)} rows={3} className={`${fieldCls} resize-none font-mono text-xs`} dir="rtl" />
        </Field>

        <div className="flex flex-wrap gap-4 pt-3 border-t border-border mt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-bold font-sans">تمكين طلب واتساب السريع</span>
            <Toggle checked={cart.quickWhatsAppOrder} onChange={(v) => setCart("quickWhatsAppOrder", v)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-bold font-sans">حقل كوبونات الخصم بالسلة</span>
            <Toggle checked={cart.couponFieldEnabled} onChange={(v) => setCart("couponFieldEnabled", v)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-bold font-sans">شريط السلة العائم</span>
            <Toggle checked={cart.floatingBarEnabled} onChange={(v) => setCart("floatingBarEnabled", v)} />
          </div>
        </div>
      </SectionCard>

      {/* Checkout Builder */}
      <SectionCard title="إعدادات وحقول صفحة الدفع والطلب" badge="Checkout Builder">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center justify-between rounded-xl border border-border p-3">
            <span className="text-xs font-bold mb-2">طلب رقم الهاتف</span>
            <Toggle checked={checkout.requirePhone} onChange={(v) => setCheck("requirePhone", v)} />
          </div>
          <div className="flex flex-col items-center justify-between rounded-xl border border-border p-3">
            <span className="text-xs font-bold mb-2">طلب العنوان الكامل</span>
            <Toggle checked={checkout.requireAddress} onChange={(v) => setCheck("requireAddress", v)} />
          </div>
          <div className="flex flex-col items-center justify-between rounded-xl border border-border p-3">
            <span className="text-xs font-bold mb-2">طلب البريد الإلكتروني</span>
            <Toggle checked={checkout.requireEmail} onChange={(v) => setCheck("requireEmail", v)} />
          </div>
        </div>
      </SectionCard>

      {/* Shipping Rates */}
      <SectionCard title="أسعار تكاليف الشحن حسب المدن" badge="Checkout Builder">
        <div className="space-y-3">
          <div className="flex gap-2">
            <input type="text" placeholder="المدينة (مثال: صنعاء، عدن)" value={newCity} onChange={(e) => setNewCity(e.target.value)} className={fieldCls} />
            <input type="number" placeholder="تكلفة الشحن (ريال)" value={newRate} onChange={(e) => setNewRate(Number(e.target.value))} className={fieldCls} />
            <button type="button" onClick={addShippingRate} className="bg-primary text-primary-foreground px-4 rounded-xl font-bold flex items-center gap-1 hover:opacity-90 mt-1">
              <Plus className="h-4 w-4" /> إدخال
            </button>
          </div>
          {checkout.shippingRates.length > 0 ? (
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {checkout.shippingRates.map((rate, i) => (
                <div key={i} className="flex items-center justify-between p-3 text-sm">
                  <span className="font-bold">{rate.city}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-muted-foreground">{rate.rate.toLocaleString()} ر.ي</span>
                    <button type="button" onClick={() => removeShippingRate(i)} className="text-destructive p-1 hover:bg-destructive/10 rounded-lg">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center">لا توجد تسعيرات مخصصة. سيتم تطبيق الشحن المجاني أو السعر الافتراضي.</p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

// ── 05. Navigation & Menus Tab ────────────────────────────────────────────────
interface NavigationTabProps {
  nav: NavigationConfig;
  onNavChange: (v: NavigationConfig) => void;
}
function NavigationTab({
  nav,
  onNavChange,
}: NavigationTabProps) {
  const set = <K extends keyof NavigationConfig>(k: K, v: NavigationConfig[K]) =>
    onNavChange({ ...nav, [k]: v });

  const moveLink = (index: number, dir: "up" | "down") => {
    const links = [...nav.headerLinks];
    const newIdx = dir === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= links.length) return;
    [links[index], links[newIdx]] = [links[newIdx], links[index]];
    onNavChange({ ...nav, headerLinks: links.map((l, i) => ({ ...l, order: i + 1 })) });
  };

  const addLink = () => {
    const newLink = {
      label: "صفحة جديدة",
      to: "/page-url",
      icon: "Link",
      visible: true,
      order: nav.headerLinks.length + 1,
      external: false,
      target: "_self" as const,
    };
    onNavChange({ ...nav, headerLinks: [...nav.headerLinks, newLink] });
  };

  const removeLink = (index: number) => {
    const links = nav.headerLinks.filter((_, i) => i !== index);
    onNavChange({ ...nav, headerLinks: links.map((l, i) => ({ ...l, order: i + 1 })) });
  };

  return (
    <div className="space-y-4">
      {/* Header Builder */}
      <SectionCard title="إعدادات وترويسة المتجر" badge="Header Builder">
        <div className="grid grid-cols-2 gap-3">
          <Field label="اسم المتجر الرئيسي">
            <input value={nav.storeName} onChange={(e) => set("storeName", e.target.value)} className={fieldCls} />
          </Field>
          <Field label="الشعار الفرعي (Tagline)">
            <input value={nav.tagline} onChange={(e) => set("tagline", e.target.value)} className={fieldCls} />
          </Field>
        </div>
        <ImageUploader
          label="شعار المتجر (Logo)"
          value={nav.logoUrl}
          onChange={(val) => set("logoUrl", val)}
        />
      </SectionCard>

      {/* Menu Builder */}
      <SectionCard title="شجرة روابط وقائمة التنقل" badge="Menu Builder">
        <div className="space-y-3">
          {nav.headerLinks
            .sort((a, b) => a.order - b.order)
            .map((link, index) => (
              <div key={index} className="rounded-xl border border-border p-3 space-y-2 bg-background/50">
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Toggle checked={link.visible} onChange={(v) => {
                      const links = [...nav.headerLinks];
                      links[index] = { ...links[index], visible: v };
                      set("headerLinks", links);
                    }} />
                    <span className="text-sm font-bold text-foreground">{link.label}</span>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" disabled={index === 0} onClick={() => moveLink(index, "up")} className="rounded p-1 hover:bg-accent disabled:opacity-30">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button type="button" disabled={index === nav.headerLinks.length - 1} onClick={() => moveLink(index, "down")} className="rounded p-1 hover:bg-accent disabled:opacity-30">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => removeLink(index)} className="text-destructive p-1 hover:bg-destructive/10 rounded-lg">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="اسم الرابط">
                    <input value={link.label} onChange={(e) => {
                      const links = [...nav.headerLinks];
                      links[index] = { ...links[index], label: e.target.value };
                      set("headerLinks", links);
                    }} className={fieldCls} />
                  </Field>
                  <Field label="مسار الرابط (URL / Path)">
                    <input value={link.to} onChange={(e) => {
                      const links = [...nav.headerLinks];
                      links[index] = { ...links[index], to: e.target.value };
                      set("headerLinks", links);
                    }} className={fieldCls} dir="ltr" />
                  </Field>
                </div>
              </div>
            ))}
          <button type="button" onClick={addLink} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border p-3 rounded-xl hover:border-primary text-muted-foreground hover:text-primary transition font-bold text-xs">
            <Plus className="h-4 w-4" /> إضافة رابط تنقل جديد
          </button>
        </div>
      </SectionCard>

      {/* Footer Builder */}
      <SectionCard title="بيانات وعناصر الفوتر (مذيل الصفحة) والتواصل" badge="Footer Builder">
        <Field label="وصف المتجر في التذييل">
          <textarea value={nav.footerDescription} onChange={(e) => set("footerDescription", e.target.value)} rows={3} className={`${fieldCls} resize-none`} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="عنوان المتجر المباشر (Address)">
            <input value={nav.addressText} onChange={(e) => set("addressText", e.target.value)} className={fieldCls} placeholder="صنعاء - شارع بينون..." />
          </Field>
          <Field label="نص خدمة الشحن والتوصيل">
            <input value={nav.deliveryInfoText} onChange={(e) => set("deliveryInfoText", e.target.value)} className={fieldCls} placeholder="متوفر خدمة التوصيل لجميع المحافظات..." />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="رقم واتساب للتواصل السريع">
            <input value={nav.whatsappPhone} onChange={(e) => set("whatsappPhone", e.target.value)} className={fieldCls} dir="ltr" placeholder="967771370740" />
          </Field>
          <Field label="البريد الإلكتروني للدعم">
            <input value={nav.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} className={fieldCls} dir="ltr" />
          </Field>
        </div>

        <div className="pt-2 border-t border-border/40">
          <span className="text-xs font-bold text-muted-foreground block mb-2">روابط صفحات التواصل الاجتماعي</span>
          <div className="grid grid-cols-4 gap-2">
            <Field label="فيسبوك (Facebook)">
              <input value={nav.socialLinks.facebook} onChange={(e) => set("socialLinks", { ...nav.socialLinks, facebook: e.target.value })} className={fieldCls} dir="ltr" />
            </Field>
            <Field label="انستغرام (Instagram)">
              <input value={nav.socialLinks.instagram} onChange={(e) => set("socialLinks", { ...nav.socialLinks, instagram: e.target.value })} className={fieldCls} dir="ltr" />
            </Field>
            <Field label="تيك توك (TikTok)">
              <input value={nav.socialLinks.tiktok ?? ""} onChange={(e) => set("socialLinks", { ...nav.socialLinks, tiktok: e.target.value })} className={fieldCls} dir="ltr" />
            </Field>
            <Field label="تويتر / منصة إكس (X)">
              <input value={nav.socialLinks.twitter} onChange={(e) => set("socialLinks", { ...nav.socialLinks, twitter: e.target.value })} className={fieldCls} dir="ltr" />
            </Field>
          </div>
        </div>

        <Field label="حقوق النشر والملكية">
          <input value={nav.copyrightText} onChange={(e) => set("copyrightText", e.target.value)} className={fieldCls} />
        </Field>
      </SectionCard>
    </div>
  );
}

// ── 06. Content (Pages & Translations) Tab ────────────────────────────────────
interface ContentTabProps {
  pages: PagesConfig;
  translation: TranslationConfig;
  onPagesChange: (v: PagesConfig) => void;
  onTranslationChange: (v: TranslationConfig) => void;
}
function ContentTab({
  pages,
  translation,
  onPagesChange,
  onTranslationChange,
}: ContentTabProps) {
  const setTrans = <K extends keyof TranslationConfig>(k: K, v: TranslationConfig[K]) =>
    onTranslationChange({ ...translation, [k]: v });

  const [activePageIdx, setActivePageIdx] = useState<number | null>(null);

  const addPage = () => {
    const newPage = {
      id: Math.random().toString(36).substr(2, 9),
      slug: "new-page-" + Date.now().toString().slice(-4),
      title: "عنوان الصفحة الجديدة",
      content: "# محتوى الصفحة المخصصة\nاكتب تفاصيل صفحتك هنا...",
      isPublished: true,
    };
    onPagesChange({ ...pages, pages: [...pages.pages, newPage] });
    setActivePageIdx(pages.pages.length);
  };

  const removePage = (idx: number) => {
    onPagesChange({ ...pages, pages: pages.pages.filter((_, i) => i !== idx) });
    setActivePageIdx(null);
  };

  const updateActivePage = <K extends keyof CustomPage>(k: K, v: CustomPage[K]) => {
    if (activePageIdx === null) return;
    const list = [...pages.pages];
    list[activePageIdx] = { ...list[activePageIdx], [k]: v };
    onPagesChange({ ...pages, pages: list });
  };

  return (
    <div className="space-y-4">
      {/* Pages CMS */}
      <SectionCard title="إدارة الصفحات المخصصة" badge="Pages CMS">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 border-r border-border pr-2 space-y-2">
            <span className="text-[11px] font-bold text-muted-foreground block mb-2 font-sans">قائمة الصفحات</span>
            {pages.pages.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePageIdx(idx)}
                className={`w-full text-right p-2.5 rounded-xl text-xs font-bold truncate transition font-sans ${
                  activePageIdx === idx ? "bg-primary/20 text-primary" : "hover:bg-accent text-foreground"
                }`}
              >
                {p.title || "بدون عنوان"}
              </button>
            ))}
            <button type="button" onClick={addPage} className="w-full flex items-center justify-center gap-1 bg-primary/10 text-primary p-2.5 rounded-xl font-bold text-xs mt-2 hover:bg-primary/20">
              <Plus className="h-4 w-4" /> صفحة جديدة
            </button>
          </div>

          <div className="col-span-2 space-y-3">
            {activePageIdx !== null && pages.pages[activePageIdx] ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground font-sans">تعديل الصفحة</span>
                  <button type="button" onClick={() => removePage(activePageIdx!)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-xl">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <Field label="عنوان الصفحة">
                  <input value={pages.pages[activePageIdx].title} onChange={(e) => updateActivePage("title", e.target.value)} className={fieldCls} />
                </Field>
                <Field label="المسار الفرعي (Slug)">
                  <input value={pages.pages[activePageIdx].slug} onChange={(e) => updateActivePage("slug", e.target.value)} className={fieldCls} dir="ltr" />
                </Field>
                <Field label="المحتوى (تدعم Markdown)">
                  <textarea value={pages.pages[activePageIdx].content} onChange={(e) => updateActivePage("content", e.target.value)} rows={8} className={`${fieldCls} font-mono text-xs`} />
                </Field>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-bold font-sans">حالة النشر للمشاهدين</span>
                  <Toggle checked={pages.pages[activePageIdx].isPublished} onChange={(v) => updateActivePage("isPublished", v)} />
                </div>
              </>
            ) : (
              <div className="flex h-36 items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-border rounded-xl font-sans">
                حدد صفحة من القائمة الجانبية لتعديلها أو أنشئ صفحة جديدة.
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Translation CMS */}
      <SectionCard title="مترجم نصوص وعناصر واجهة العميل" badge="Translation CMS">
        <div className="grid grid-cols-2 gap-3">
          <Field label="نص زر إضافة للسلة">
            <input value={translation.addToCart} onChange={(e) => setTrans("addToCart", e.target.value)} className={fieldCls} />
          </Field>
          <Field label="نص زر إتمام الطلب">
            <input value={translation.checkout} onChange={(e) => setTrans("checkout", e.target.value)} className={fieldCls} />
          </Field>
          <Field label="نص زر طلب واتساب السريع">
            <input value={translation.quickOrder} onChange={(e) => setTrans("quickOrder", e.target.value)} className={fieldCls} />
          </Field>
          <Field label="نص السلة الفارغة">
            <input value={translation.emptyCart} onChange={(e) => setTrans("emptyCart", e.target.value)} className={fieldCls} />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}

// ── 07. Notifications & SEO Tab ───────────────────────────────────────────────
interface NotificationsTabProps {
  notif: NotificationsConfig;
  seo: SeoConfig;
  onNotifChange: (v: NotificationsConfig) => void;
  onSeoChange: (v: SeoConfig) => void;
}
function NotificationsTab({
  notif,
  seo,
  onNotifChange,
  onSeoChange,
}: {
  notif: NotificationsConfig;
  seo: SeoConfig;
  onNotifChange: (v: NotificationsConfig) => void;
  onSeoChange: (v: SeoConfig) => void;
}) {
  const setNotif = <K extends keyof NotificationsConfig>(k: K, v: NotificationsConfig[K]) =>
    onNotifChange({ ...notif, [k]: v });

  const setSeo = <K extends keyof SeoConfig>(k: K, v: SeoConfig[K]) =>
    onSeoChange({ ...seo, [k]: v });

  return (
    <div className="space-y-4">
      {/* Announcement Bar */}
      <SectionCard title="شريط الإعلانات العلوي للمتجر" badge="Notification Center">
        <div className="flex items-center justify-between mb-2">
          <Label>تفعيل شريط الإعلان العلوي</Label>
          <Toggle checked={notif.announcementEnabled} onChange={(v) => setNotif("announcementEnabled", v)} />
        </div>
        <Field label="نص شريط الإعلان">
          <input value={notif.announcementText} onChange={(e) => setNotif("announcementText", e.target.value)} className={fieldCls} />
        </Field>
        <Field label="لون خلفية شريط الإعلان">
          <div className="flex gap-2 mt-1">
            <input type="color" value={notif.announcementBg} onChange={(e) => setNotif("announcementBg", e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-background p-0.5" />
            <input value={notif.announcementBg} onChange={(e) => setNotif("announcementBg", e.target.value)} className={`${fieldCls} !mt-0 font-mono text-xs`} dir="ltr" />
          </div>
        </Field>
      </SectionCard>

      {/* Discount Popup */}
      <SectionCard title="النافذة المنبثقة الترويجية" badge="Notification Center">
        <div className="flex items-center justify-between mb-2">
          <Label>تفعيل النافذة المنبثقة الترويجية</Label>
          <Toggle checked={notif.popupEnabled} onChange={(v) => setNotif("popupEnabled", v)} />
        </div>
        <Field label="عنوان النافذة">
          <input value={notif.popupTitle} onChange={(e) => setNotif("popupTitle", e.target.value)} className={fieldCls} />
        </Field>
        <Field label="نص النافذة">
          <textarea value={notif.popupText} onChange={(e) => setNotif("popupText", e.target.value)} rows={2} className={fieldCls} />
        </Field>
        <ImageUploader
          label="صورة النافذة الإعلانية"
          value={notif.popupImage}
          onChange={(val) => setNotif("popupImage", val)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="نص زر CTA">
            <input value={notif.popupCta} onChange={(e) => setNotif("popupCta", e.target.value)} className={fieldCls} />
          </Field>
          <Field label="رابط زر CTA">
            <input value={notif.popupLink} onChange={(e) => setNotif("popupLink", e.target.value)} className={fieldCls} dir="ltr" />
          </Field>
        </div>
      </SectionCard>

      {/* SEO Manager */}
      <SectionCard title="إعدادات الأرشفة والـ SEO" badge="SEO Manager">
        <Field label="عنوان الصفحة الرئيسي (Meta Title)" required>
          <input value={seo.metaTitle} onChange={(e) => setSeo("metaTitle", e.target.value)} className={fieldCls} />
        </Field>
        <Field label="وصف محركات البحث (Meta Description)">
          <textarea value={seo.metaDescription} onChange={(e) => setSeo("metaDescription", e.target.value)} rows={3} className={fieldCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="معرف تحليلات Google (Analytics G-ID)">
            <input value={seo.googleAnalyticsId} onChange={(e) => setSeo("googleAnalyticsId", e.target.value)} className={fieldCls} placeholder="G-XXXXXXXXXX" dir="ltr" />
          </Field>
          <Field label="معرف فيسبوك بيكسل (Pixel ID)">
            <input value={seo.facebookPixelId} onChange={(e) => setSeo("facebookPixelId", e.target.value)} className={fieldCls} placeholder="1234567890" dir="ltr" />
          </Field>
        </div>
        <div className="flex gap-4 pt-2 border-t border-border mt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-bold font-sans">توليد خريطة الموقع Sitemap.xml</span>
            <Toggle checked={seo.sitemapEnabled} onChange={(v) => setSeo("sitemapEnabled", v)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-bold font-sans">تمكين ملفات الفهرسة Robots.txt</span>
            <Toggle checked={seo.robotsEnabled} onChange={(v) => setSeo("robotsEnabled", v)} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ── 08. Studio Dashboard & Logs Tab ───────────────────────────────────────────
function StudioTab() {
  const getLogs = useServerFn(getStorefrontChangeLogs);
  const restoreVersion = useServerFn(restoreStorefrontVersion);
  const logsQ = useQuery({
    queryKey: ["storefront-change-logs-studio"],
    queryFn: () => getLogs(),
  });

  const restoreMut = useMutation({
    mutationFn: (logId: string) => restoreVersion({ data: { logId } }),
    onSuccess: (r) => {
      if (r.success) {
        toast.success(`↩️ تمت استعادة نسخة «${r.key}» ونشرها حياً`);
        void notifyStorefrontPublished();
        logsQ.refetch();
      } else {
        toast.error(r.message ?? "تعذّرت الاستعادة");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const logs = (logsQ.data ?? []) as ChangeLogEntry[];

  return (
    <div className="space-y-4">
      {/* Analytics Dashboard */}
      <SectionCard title="استوديو إحصائيات المتجر والتحويل" badge="Analytics Dashboard">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-background/55 p-4 rounded-2xl border border-border flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase font-sans">معدل نقرات التحويل للواتساب</span>
              <p className="text-2xl font-black mt-1 text-primary font-mono">12.4%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary/30" />
          </div>
          <div className="bg-background/55 p-4 rounded-2xl border border-border flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase font-sans">الزيارات النشطة للمتجر</span>
              <p className="text-2xl font-black mt-1 text-success font-mono">842 زيارة</p>
            </div>
            <EyeIcon className="h-8 w-8 text-success/30" />
          </div>
          <div className="bg-background/55 p-4 rounded-2xl border border-border flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase font-sans">طلبات الشراء المستلمة</span>
              <p className="text-2xl font-black mt-1 text-purple-400 font-mono">48 طلب</p>
            </div>
            <ShoppingCartIcon className="h-8 w-8 text-purple-400/30" />
          </div>
        </div>
      </SectionCard>

      {/* Permissions */}
      <SectionCard title="صلاحيات وأمان استوديو CMS" badge="Permissions (Role Based)">
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-2xl text-xs font-sans">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
          <div>
            <span className="font-bold text-foreground block">الصلاحيات: مدير النظام الفعال (Super Administrator)</span>
            <span className="text-muted-foreground">صلاحيات كاملة للمطالعة، المسودات، الحفظ والنسخ المتطابق مع قواعد البيانات.</span>
          </div>
        </div>
      </SectionCard>

      {/* Audit Log / Version History */}
      <SectionCard title="سجل المراجعة والتدقيق للمطورين والمدراء" badge="Audit Log">
        {logs.length > 0 ? (
          <div className="divide-y divide-border border border-border rounded-xl overflow-hidden text-xs max-h-64 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-2 p-3 hover:bg-background/40 font-mono">
                <span className="text-primary font-bold">{log.key_changed}</span>
                <span className="bg-background/90 text-muted-foreground rounded-full px-2 py-0.5 text-[10px]">
                  {log.action_type === "publish"
                    ? "نشر نهائي"
                    : log.action_type === "restore"
                      ? "استعادة نسخة"
                      : "مسودة محفوظة"}
                </span>
                <span className="text-muted-foreground shrink-0">{log.user_email || "—"}</span>
                <span className="text-muted-foreground text-[10px] shrink-0">
                  {new Date(log.created_at).toLocaleString("ar", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {log.old_value != null && (
                  <button
                    onClick={() => restoreMut.mutate(log.id)}
                    disabled={restoreMut.isPending}
                    title="استعادة هذه النسخة ونشرها حياً"
                    className="shrink-0 rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary transition hover:bg-primary/20 disabled:opacity-50"
                  >
                    ↩️ استعادة
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center font-sans">لا توجد سجلات تعديل سابقة في قاعدة البيانات.</p>
        )}
      </SectionCard>
    </div>
  );
}

// ── Main Page Layout Component ────────────────────────────────────────────────
function StorefrontCMSPage() {
  const queryClient = useQueryClient();
  const getSettings = useServerFn(getStorefrontAppearance);
  const saveDraft = useServerFn(saveStorefrontDraft);
  const saveSettings = useServerFn(updateStorefrontAppearance);

  const [activeTab, setActiveTab] = useState<TabId>("homepage");
  const [local, setLocal] = useState<StorefrontSettingsShape>(DEFAULT_STOREFRONT_SETTINGS);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("mobile");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const dirty = useRef(false);

  const settingsQ = useQuery({
    queryKey: ["storefront-settings-cms-premium"],
    queryFn: () => getSettings({ data: { previewMode: true } }),
    staleTime: 10_000,
  });

  useEffect(() => {
    if (settingsQ.data && typeof settingsQ.data === "object" && "theme" in settingsQ.data) {
      setLocal(settingsQ.data as StorefrontSettingsShape);
      dirty.current = false;
    }
  }, [settingsQ.data]);

  const handleChange = useCallback(<K extends keyof StorefrontSettingsShape>(key: K, value: StorefrontSettingsShape[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
    dirty.current = true;
  }, []);

  const saveMut = useMutation({
    mutationFn: async () => {
      // Map current UI tab to the actual DB settings keys
      const tabKeys: Record<TabId, Array<keyof StorefrontSettingsShape>> = {
        homepage: ["hero", "sections"],
        theme: ["theme"],
        catalog: ["products_layout", "product_page"],
        checkout: ["cart_config", "checkout"],
        navigation: ["navigation"],
        content: ["pages", "translation"],
        notifications: ["notifications", "seo"],
        studio: ["advanced"],
      };

      const keysToSave = tabKeys[activeTab];
      const results = await Promise.all(
        keysToSave.map((key) => saveDraft({ data: { key, value: local[key] } }))
      );
      return results;
    },
    onSuccess: (res) => {
      const firstError = res.find((r) => !r.success);
      if (!firstError) {
        toast.success("📝 تم حفظ مسودة هذا القسم بنجاح!");
        setSavedAt(new Date());
        dirty.current = false;
        queryClient.invalidateQueries({ queryKey: ["admin-seo-config"] });
        queryClient.invalidateQueries({ queryKey: ["storefront-settings"] });
        queryClient.invalidateQueries({ queryKey: ["storefront-settings-cms-premium"] });
        void settingsQ.refetch();
        void notifyStorefrontPublished();
      } else {
        toast.error(firstError.message ?? "حدث خطأ أثناء حفظ المسودة");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveAllMut = useMutation({
    mutationFn: async () => {
      const keys: Array<keyof StorefrontSettingsShape> = [
        "hero",
        "theme",
        "products_layout",
        "product_page",
        "cart_config",
        "checkout",
        "navigation",
        "pages",
        "translation",
        "notifications",
        "sections",
        "seo",
        "advanced",
      ];
      const results = await Promise.all(
        keys.map((key) => saveSettings({ data: { key, value: local[key] } }))
      );
      return results;
    },
    onSuccess: (res) => {
      const firstError = res.find((r) => !r.success);
      if (!firstError) {
        toast.success("🚀 تم نشر جميع الإعدادات وتطبيقها حياً على المتجر!");
        setSavedAt(new Date());
        dirty.current = false;
        queryClient.invalidateQueries({ queryKey: ["admin-seo-config"] });
        queryClient.invalidateQueries({ queryKey: ["storefront-settings"] });
        queryClient.invalidateQueries({ queryKey: ["storefront-settings-cms-premium"] });
        void settingsQ.refetch();
        void notifyStorefrontPublished();
      } else {
        toast.error(firstError.message ?? "حدث خطأ أثناء نشر الإعدادات");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (settingsQ.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">جاري تحميل استوديو الإعدادات...</span>
      </div>
    );
  }

  const isPending = saveMut.isPending || saveAllMut.isPending;

  return (
    <div className="space-y-6 pb-32">
      {/* Header Info */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black sm:text-2xl flex items-center gap-2 font-sans text-foreground">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            لوحة تحكم NOQTA Storefront Studio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground font-sans">
            تخصيص وإدارة شاملة لجميع أقسام ومظهر واجهة متجر العميل ثلاثية الأبعاد بمرونة مطلقة.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold hover:bg-accent transition font-sans text-foreground"
          >
            <Eye className="h-4 w-4" />
            معاينة المتجر المباشر
          </a>
        </div>
      </div>

      {savedAt && (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-4 py-2.5 text-sm text-success font-bold font-sans">
          <CheckCircle2 className="h-4 w-4" />
          تمت المزامنة بنجاح وحفظ التعديلات في:{" "}
          {savedAt.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      )}

      {/* 3-Column Layout with Sticky Live Preview */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Sidebar tabs (Col width: 2/12) */}
        <div className="lg:col-span-2">
          <div className="sticky top-20 space-y-1 rounded-2xl border border-border bg-surface p-3 shadow-sm">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition font-sans ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary border-r-4 border-primary"
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

        {/* Tab configuration fields (Col width: 5/12) */}
        <div className="lg:col-span-5 space-y-4">
          {activeTab === "homepage" && (
            <HomepageTab
              hero={local.hero}
              sections={local.sections}
              onHeroChange={(v) => handleChange("hero", v)}
              onSectionsChange={(v) => handleChange("sections", v)}
            />
          )}
          {activeTab === "theme" && (
            <ThemeTab cfg={local.theme} onChange={(v) => handleChange("theme", v)} />
          )}
          {activeTab === "catalog" && (
            <CatalogTab
              layout={local.products_layout}
              page={local.product_page}
              onLayoutChange={(v) => handleChange("products_layout", v)}
              onPageChange={(v) => handleChange("product_page", v)}
            />
          )}
          {activeTab === "checkout" && (
            <CheckoutTab
              cart={local.cart_config}
              checkout={local.checkout}
              onCartChange={(v) => handleChange("cart_config", v)}
              onCheckoutChange={(v) => handleChange("checkout", v)}
            />
          )}
          {activeTab === "navigation" && (
            <NavigationTab nav={local.navigation} onNavChange={(v) => handleChange("navigation", v)} />
          )}
          {activeTab === "content" && (
            <ContentTab
              pages={local.pages}
              translation={local.translation}
              onPagesChange={(v) => handleChange("pages", v)}
              onTranslationChange={(v) => handleChange("translation", v)}
            />
          )}
          {activeTab === "notifications" && (
            <NotificationsTab
              notif={local.notifications}
              seo={local.seo}
              onNotifChange={(v) => handleChange("notifications", v)}
              onSeoChange={(v) => handleChange("seo", v)}
            />
          )}
          {activeTab === "studio" && <StudioTab />}
        </div>

        {/* Live Preview (Col width: 5/12 - STICKY) */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 rounded-2xl border border-border bg-surface p-4 space-y-4 shadow-sm">
            {/* Live Preview Header Viewport Switcher */}
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <h3 className="text-xs font-bold text-foreground font-sans">المعاينة التفاعلية الفورية (مسودة)</h3>
              </div>
              <div className="flex items-center gap-1 rounded-xl bg-background p-1 border border-border">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-1.5 rounded-lg transition ${previewDevice === "desktop" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-accent"}`}
                >
                  <Laptop className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("tablet")}
                  className={`p-1.5 rounded-lg transition ${previewDevice === "tablet" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-accent"}`}
                >
                  <TabletIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-1.5 rounded-lg transition ${previewDevice === "mobile" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-accent"}`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Simulated Live Viewport Frame */}
            <div className="bg-background/20 p-2 rounded-2xl border border-border/40 overflow-hidden flex items-center justify-center min-h-[540px]">
              <LivePreviewDevice local={local} viewport={previewDevice} />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <p className="min-w-0 text-xs text-muted-foreground font-bold font-sans">
            <FileText className="inline h-3.5 w-3.5 me-1 text-primary" />
            القسم المفتوح: <span className="text-foreground font-sans">{TABS.find((t) => t.id === activeTab)?.label}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => saveMut.mutate()}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 transition disabled:opacity-60 font-sans"
            >
              {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              حفظ هذا القسم كمسودة
            </button>
            <button
              type="button"
              onClick={() => saveAllMut.mutate()}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-lg transition hover:bg-primary/95 disabled:opacity-60 font-sans"
            >
              {saveAllMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              نشر كل التغييرات للمتجر
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
