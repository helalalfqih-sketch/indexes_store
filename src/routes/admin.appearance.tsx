import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Palette,
  Home,
  Package,
  ShoppingCart,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Trash,
  Plus,
} from "lucide-react";
import {
  getStorefrontAppearance,
  updateStorefrontAppearance,
} from "@/lib/actions/appearance.actions";
import { listAdminProducts } from "@/lib/actions/admin.actions";
import {
  DEFAULT_STOREFRONT_SETTINGS,
  type StorefrontSettingsShape,
  type HeroConfig,
  type ThemeConfig,
  type ProductsLayoutConfig,
  type CartConfig,
  type NavigationConfig,
} from "@/lib/domain/appearance";

export const Route = createFileRoute("/admin/appearance")({
  head: () => ({ meta: [{ title: "مظهر المتجر — لوحة الإدارة" }] }),
  component: AdminAppearancePage,
});

type TabType = "hero" | "theme" | "products" | "cart" | "navigation";

function AdminAppearancePage() {
  const [activeTab, setActiveTab] = useState<TabType>("hero");
  const [settings, setSettings] = useState<StorefrontSettingsShape>(DEFAULT_STOREFRONT_SETTINGS);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch initial settings and products from DB
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [appearanceData, productsRes] = await Promise.all([
          getStorefrontAppearance(),
          listAdminProducts(),
        ]);
        setSettings(appearanceData);
        setAllProducts(productsRes || []);
      } catch (err) {
        console.error("Failed to load storefront appearance/products:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveKey = async <K extends keyof StorefrontSettingsShape>(
    key: K,
    value: StorefrontSettingsShape[K]
  ) => {
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await updateStorefrontAppearance({ data: { key, value } });
      if (res.success) {
        setSuccessMsg("تم حفظ الإعدادات بنجاح! 🚀");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.message || "فشل في حفظ الإعدادات");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
            <Palette className="h-6 w-6 text-primary" />
            إدارة مظهر الواجهة العامة (Storefront Appearance)
          </h1>
          <p className="text-sm text-muted-foreground">
            التحكم الكامل في تصميم الصفحة الرئيسية، العروض، المنتجات، السلة، والثيم العام لجميع الزوار.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-foreground shadow-card hover:bg-accent transition"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? "إخفاء المعاينة" : "معاينة مباشرة"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success shadow-sm">
          <CheckCircle2 className="h-5 w-5" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive shadow-sm">
          <AlertCircle className="h-5 w-5" />
          {errorMsg}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border overflow-x-auto gap-2">
        <TabButton
          active={activeTab === "hero"}
          onClick={() => setActiveTab("hero")}
          icon={Home}
          label="البنر الرئيسي (Hero)"
        />
        <TabButton
          active={activeTab === "theme"}
          onClick={() => setActiveTab("theme")}
          icon={Palette}
          label="السمة والألوان (Theme)"
        />
        <TabButton
          active={activeTab === "products"}
          onClick={() => setActiveTab("products")}
          icon={Package}
          label="شبكة المنتجات (Product Grid)"
        />
        <TabButton
          active={activeTab === "cart"}
          onClick={() => setActiveTab("cart")}
          icon={ShoppingCart}
          label="السلة والواتساب (Cart)"
        />
        <TabButton
          active={activeTab === "navigation"}
          onClick={() => setActiveTab("navigation")}
          icon={Globe}
          label="التنقل والتذييل (Navigation)"
        />
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={showPreview ? "lg:col-span-2 space-y-6" : "lg:col-span-3 space-y-6"}>
          {activeTab === "hero" && (
            <HeroTab
              config={settings.hero}
              allProducts={allProducts}
              onChange={(updated) => setSettings((s) => ({ ...s, hero: updated }))}
              onSave={() => handleSaveKey("hero", settings.hero)}
              isSaving={isSaving}
            />
          )}

          {activeTab === "theme" && (
            <ThemeTab
              config={settings.theme}
              onChange={(updated) => setSettings((s) => ({ ...s, theme: updated }))}
              onSave={() => handleSaveKey("theme", settings.theme)}
              isSaving={isSaving}
            />
          )}

          {activeTab === "products" && (
            <ProductsTab
              config={settings.products_layout}
              onChange={(updated) => setSettings((s) => ({ ...s, products_layout: updated }))}
              onSave={() => handleSaveKey("products_layout", settings.products_layout)}
              isSaving={isSaving}
            />
          )}

          {activeTab === "cart" && (
            <CartTab
              config={settings.cart_config}
              onChange={(updated) => setSettings((s) => ({ ...s, cart_config: updated }))}
              onSave={() => handleSaveKey("cart_config", settings.cart_config)}
              isSaving={isSaving}
            />
          )}

          {activeTab === "navigation" && (
            <NavigationTab
              config={settings.navigation}
              onChange={(updated) => setSettings((s) => ({ ...s, navigation: updated }))}
              onSave={() => handleSaveKey("navigation", settings.navigation)}
              isSaving={isSaving}
            />
          )}
        </div>

        {/* Live Preview Side Panel */}
        {showPreview && (
          <div className="lg:col-span-1 space-y-4">
            <div className="sticky top-20 rounded-2xl border border-border bg-surface p-4 shadow-card space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-primary" />
                  معاينة مظهر العناصر
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  Live Preview
                </span>
              </div>

              {/* Dynamic Preview Card */}
              <div className="rounded-xl border border-border bg-background p-3 space-y-3">
                <div
                  className="rounded-lg p-3 text-center text-white font-black text-sm transition-all"
                  style={{ background: settings.theme.primaryColor }}
                >
                  {settings.hero.title || "عنوان المعرض الرئيسي"}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {settings.hero.subtitle || "الوصف الفرعي المعروض للزوار"}
                </p>

                <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
                  <span className="font-bold">زر الإجراء (CTA):</span>
                  <span
                    className="rounded-md px-2 py-1 text-[10px] font-bold"
                    style={{ background: settings.theme.secondaryColor, color: "#fff" }}
                  >
                    {settings.hero.ctaText}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Home;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors whitespace-nowrap ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// ── Tab 1: Hero Builder ────────────────────────────────────────────────────────
function HeroTab({
  config,
  allProducts = [],
  onChange,
  onSave,
  isSaving,
}: {
  config: HeroConfig;
  allProducts?: any[];
  onChange: (updated: HeroConfig) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const selectedProducts = useMemo(() => {
    const ids = config.sphereCustomProductIds || [];
    return ids
      .map((id) => allProducts.find((p) => p.id === id))
      .filter((p): p is any => p !== undefined);
  }, [config.sphereCustomProductIds, allProducts]);

  const addProduct = (productId: string) => {
    if (!productId) return;
    const currentIds = config.sphereCustomProductIds || [];
    if (currentIds.includes(productId)) return;
    onChange({
      ...config,
      sphereCustomProductIds: [...currentIds, productId],
    });
  };

  const removeProduct = (productId: string) => {
    const currentIds = config.sphereCustomProductIds || [];
    onChange({
      ...config,
      sphereCustomProductIds: currentIds.filter((id) => id !== productId),
    });
  };

  const moveProduct = (index: number, direction: "up" | "down") => {
    const currentIds = [...(config.sphereCustomProductIds || [])];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentIds.length) return;

    // Swap the elements
    const temp = currentIds[index];
    currentIds[index] = currentIds[targetIndex];
    currentIds[targetIndex] = temp;

    onChange({
      ...config,
      sphereCustomProductIds: currentIds,
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-base font-black">إعدادات البنر الرئيسي (Hero Section)</h2>
          <p className="text-xs text-muted-foreground">التحكم بالقسم الترحيبي أعلى الصفحة الرئيسية.</p>
        </div>
        <SaveButton onSave={onSave} isSaving={isSaving} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1 text-xs font-bold">
          نوع المعرض الرئيسي
          <select
            value={config.type}
            onChange={(e) => onChange({ ...config, type: e.target.value as HeroConfig["type"] })}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="sphere_3d">كرة المنتجات ثلاثية الأبعاد (3D Sphere)</option>
            <option value="cinematic">القصة السينمائية (Cinematic Story)</option>
            <option value="banner_image">صورة بنر ثابتة (Static Banner Image)</option>
            <option value="video">بنر فيديو عالي الدقة (HD Video Banner)</option>
          </select>
        </label>

        <label className="space-y-1 text-xs font-bold">
          نص الشارة العلوية (Badge)
          <input
            type="text"
            value={config.badgeText}
            onChange={(e) => onChange({ ...config, badgeText: e.target.value })}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        <label className="space-y-1 text-xs font-bold md:col-span-2">
          العنوان الرئيسي (Title)
          <input
            type="text"
            value={config.title}
            onChange={(e) => onChange({ ...config, title: e.target.value })}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        <label className="space-y-1 text-xs font-bold md:col-span-2">
          الوصف الفرعي (Subtitle)
          <textarea
            rows={2}
            value={config.subtitle}
            onChange={(e) => onChange({ ...config, subtitle: e.target.value })}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
          />
        </label>

        <label className="space-y-1 text-xs font-bold">
          نص الزر الرئيسي (CTA Button)
          <input
            type="text"
            value={config.ctaText}
            onChange={(e) => onChange({ ...config, ctaText: e.target.value })}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        <label className="space-y-1 text-xs font-bold">
          رابط الزر الرئيسي
          <input
            type="text"
            value={config.ctaLink}
            onChange={(e) => onChange({ ...config, ctaLink: e.target.value })}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        {config.type === "sphere_3d" && (
          <div className="md:col-span-2 space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4 mt-2">
            <h3 className="text-xs font-black text-primary">إعدادات معرض الكرة ثلاثية الأبعاد (3D Sphere Customization)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1 text-xs font-bold">
                مصدر المنتجات المعروضة
                <select
                  value={config.sphereProductSource || "all"}
                  onChange={(e) => onChange({ ...config, sphereProductSource: e.target.value as any })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="all">جميع المنتجات المتوفرة</option>
                  <option value="bestsellers">الأكثر مبيعاً فقط</option>
                  <option value="offers">العروض والخصومات فقط</option>
                  <option value="custom">تحديد منتجات مخصصة وترتيبها (Custom Selection)</option>
                </select>
              </label>

              <label className="space-y-1 text-xs font-bold">
                أقصى عدد للمنتجات في الكرة
                <input
                  type="number"
                  min={6}
                  max={40}
                  value={config.sphereMaxProducts || 28}
                  onChange={(e) => onChange({ ...config, sphereMaxProducts: Number(e.target.value) })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="space-y-1 text-xs font-bold">
                حجم قطر الكرة (Sphere Size)
                <select
                  value={config.sphereRadius || 2.2}
                  onChange={(e) => onChange({ ...config, sphereRadius: Number(e.target.value) })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value={1.8}>صغير (1.8)</option>
                  <option value={2.2}>عادي (2.2 الافتراضي)</option>
                  <option value={2.8}>كبير (2.8)</option>
                </select>
              </label>

              <label className="space-y-1 text-xs font-bold">
                حجم بطاقات المنتجات (Tile Size)
                <select
                  value={config.sphereTileScale || 0.8}
                  onChange={(e) => onChange({ ...config, sphereTileScale: Number(e.target.value) })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value={0.6}>صغيرة (0.6x)</option>
                  <option value={0.8}>متوسطة (0.8x الافتراضي)</option>
                  <option value={1.0}>كبيرة (1.0x)</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {config.type === "sphere_3d" && config.sphereProductSource === "custom" && (
          <div className="md:col-span-2 space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4 mt-2">
            <h3 className="text-xs font-black text-primary">تحديد وترتيب منتجات المعرض ثلاثي الأبعاد</h3>

            {/* Selector */}
            <div className="flex gap-2 items-end">
              <label className="flex-1 space-y-1 text-xs font-bold">
                اختر منتجاً لإضافته:
                <select
                  id="custom-product-select"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  defaultValue=""
                >
                  <option value="" disabled>-- اختر منتجاً --</option>
                  {allProducts
                    .filter((p) => !(config.sphereCustomProductIds || []).includes(p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  const selectEl = document.getElementById("custom-product-select") as HTMLSelectElement;
                  if (selectEl && selectEl.value) {
                    addProduct(selectEl.value);
                    selectEl.value = "";
                  }
                }}
                className="flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/95 transition whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                إضافة
              </button>
            </div>

            {/* Selected Products List */}
            {selectedProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">لم يتم اختيار أي منتجات بعد. اختر منتجاً من القائمة أعلاه.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedProducts.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-2">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="h-10 w-10 rounded-md object-cover border border-border" />
                      <span className="text-xs font-bold line-clamp-1">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveProduct(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 rounded-md hover:bg-accent text-muted-foreground disabled:opacity-30 disabled:pointer-events-none"
                        title="تحريك لأعلى"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveProduct(idx, "down")}
                        disabled={idx === selectedProducts.length - 1}
                        className="p-1 rounded-md hover:bg-accent text-muted-foreground disabled:opacity-30 disabled:pointer-events-none"
                        title="تحريك لأسفل"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeProduct(p.id)}
                        className="p-1 rounded-md hover:bg-destructive/10 text-destructive"
                        title="حذف"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 2: Theme Settings ──────────────────────────────────────────────────────
function ThemeTab({
  config,
  onChange,
  onSave,
  isSaving,
}: {
  config: ThemeConfig;
  onChange: (updated: ThemeConfig) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-base font-black">إعدادات الألوان والسمة (Theme & Colors)</h2>
          <p className="text-xs text-muted-foreground">تخصيص الهوية البصرية والرموز الدلالية للموقع.</p>
        </div>
        <SaveButton onSave={onSave} isSaving={isSaving} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1 text-xs font-bold">
          اللون الأساسي (Primary Color)
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.primaryColor}
              onChange={(e) => onChange({ ...config, primaryColor: e.target.value })}
              className="h-10 w-14 rounded-lg border border-input cursor-pointer bg-background p-1"
            />
            <input
              type="text"
              value={config.primaryColor}
              onChange={(e) => onChange({ ...config, primaryColor: e.target.value })}
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </label>

        <label className="space-y-1 text-xs font-bold">
          اللون الثانوي (Secondary Accent)
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.secondaryColor}
              onChange={(e) => onChange({ ...config, secondaryColor: e.target.value })}
              className="h-10 w-14 rounded-lg border border-input cursor-pointer bg-background p-1"
            />
            <input
              type="text"
              value={config.secondaryColor}
              onChange={(e) => onChange({ ...config, secondaryColor: e.target.value })}
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </label>

        <label className="space-y-1 text-xs font-bold">
          نوع الخط (Font Family)
          <select
            value={config.fontFamily}
            onChange={(e) => onChange({ ...config, fontFamily: e.target.value })}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="Tajawal">Tajawal (تجوال - عربي حديث)</option>
            <option value="Cairo">Cairo (القاهرة)</option>
            <option value="System">الخط الافتراضي للنظام (System Default)</option>
          </select>
        </label>

        <label className="space-y-1 text-xs font-bold">
          النمط الافتراضي للزوار
          <select
            value={config.defaultMode}
            onChange={(e) => onChange({ ...config, defaultMode: e.target.value as ThemeConfig["defaultMode"] })}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="dark">داكن (Dark Mode)</option>
            <option value="light">فاتح (Light Mode)</option>
            <option value="system">حسب تفضيل نظام زائر</option>
          </select>
        </label>
      </div>
    </div>
  );
}

// ── Tab 3: Products Layout ────────────────────────────────────────────────────
function ProductsTab({
  config,
  onChange,
  onSave,
  isSaving,
}: {
  config: ProductsLayoutConfig;
  onChange: (updated: ProductsLayoutConfig) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-base font-black">تخطيط شبكة المنتجات (Product Grid)</h2>
          <p className="text-xs text-muted-foreground">التحكم في عدد الأعمدة وعناصر بطاقات المنتجات.</p>
        </div>
        <SaveButton onSave={onSave} isSaving={isSaving} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1 text-xs font-bold">
          أعمدة الشاشات الكبيرة (Desktop Columns)
          <input
            type="number"
            min={3}
            max={6}
            value={config.columnsDesktop}
            onChange={(e) => onChange({ ...config, columnsDesktop: Number(e.target.value) })}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        <label className="space-y-1 text-xs font-bold">
          أعمدة الجوال (Mobile Columns)
          <input
            type="number"
            min={1}
            max={2}
            value={config.columnsMobile}
            onChange={(e) => onChange({ ...config, columnsMobile: Number(e.target.value) })}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        <div className="md:col-span-2 space-y-3 pt-2">
          <span className="text-xs font-bold">إظهار وإخفاء عناصر بطاقة المنتج:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ToggleSwitch
              label="عرض السعر"
              checked={config.showPrice}
              onChange={(v) => onChange({ ...config, showPrice: v })}
            />
            <ToggleSwitch
              label="عرض الخصم"
              checked={config.showDiscount}
              onChange={(v) => onChange({ ...config, showDiscount: v })}
            />
            <ToggleSwitch
              label="عرض التقييمات"
              checked={config.showRating}
              onChange={(v) => onChange({ ...config, showRating: v })}
            />
            <ToggleSwitch
              label="زر الإضافة للسلة"
              checked={config.showAddToCartButton}
              onChange={(v) => onChange({ ...config, showAddToCartButton: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab 4: Cart & WhatsApp ────────────────────────────────────────────────────
function CartTab({
  config,
  onChange,
  onSave,
  isSaving,
}: {
  config: CartConfig;
  onChange: (updated: CartConfig) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-base font-black">إعدادات السلة والشراء (Cart & Checkout)</h2>
          <p className="text-xs text-muted-foreground">التحكم في شريط السلة العائم وآلية إرسال الطلب عبر واتساب.</p>
        </div>
        <SaveButton onSave={onSave} isSaving={isSaving} />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ToggleSwitch
            label="تفعيل شريط السلة العائم"
            checked={config.floatingBarEnabled}
            onChange={(v) => onChange({ ...config, floatingBarEnabled: v })}
          />
          <ToggleSwitch
            label="الطلب السريع عبر واتساب"
            checked={config.quickWhatsAppOrder}
            onChange={(v) => onChange({ ...config, quickWhatsAppOrder: v })}
          />
          <ToggleSwitch
            label="إتاحة حقل الكوبون"
            checked={config.couponFieldEnabled}
            onChange={(v) => onChange({ ...config, couponFieldEnabled: v })}
          />
          <ToggleSwitch
            label="إتاحة نموذج بيانات التسليم"
            checked={config.deliveryFormEnabled}
            onChange={(v) => onChange({ ...config, deliveryFormEnabled: v })}
          />
        </div>

        <label className="space-y-1 text-xs font-bold block pt-2">
          نص الشحن الافتراضي
          <input
            type="text"
            value={config.defaultShippingText}
            onChange={(e) => onChange({ ...config, defaultShippingText: e.target.value })}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>
    </div>
  );
}

// ── Tab 5: Navigation & Footer ────────────────────────────────────────────────
function NavigationTab({
  config,
  onChange,
  onSave,
  isSaving,
}: {
  config: NavigationConfig;
  onChange: (updated: NavigationConfig) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-base font-black">بيانات المتجر والتذييل (Store Information)</h2>
          <p className="text-xs text-muted-foreground">اسم المتجر، أرقام التواصل، ووصف التذييل السفلي.</p>
        </div>
        <SaveButton onSave={onSave} isSaving={isSaving} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1 text-xs font-bold">
          اسم المتجر الرئيسي
          <input
            type="text"
            value={config.storeName}
            onChange={(e) => onChange({ ...config, storeName: e.target.value })}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        <label className="space-y-1 text-xs font-bold">
          رقم واتساب الطلبات
          <input
            type="text"
            value={config.whatsappPhone}
            onChange={(e) => onChange({ ...config, whatsappPhone: e.target.value })}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        <label className="space-y-1 text-xs font-bold md:col-span-2">
          وصف التذييل السفلي (Footer Description)
          <textarea
            rows={2}
            value={config.footerDescription}
            onChange={(e) => onChange({ ...config, footerDescription: e.target.value })}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
          />
        </label>
      </div>
    </div>
  );
}

// ── Reusable UI Helpers ────────────────────────────────────────────────────────
function SaveButton({ onSave, isSaving }: { onSave: () => void; isSaving: boolean }) {
  return (
    <button
      onClick={onSave}
      disabled={isSaving}
      className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-brand transition-colors hover:bg-primary/90 disabled:opacity-60"
    >
      {isSaving ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
    </button>
  );
}

function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3 text-right hover:bg-accent transition"
    >
      <span className="text-xs font-bold">{label}</span>
      <div
        className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <div
          className={`h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "-translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
    </button>
  );
}
