import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Moon, Sun, Zap, Check } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import { useAppearance } from "@/components/appearance-provider";
import { saveStorefrontDraft } from "@/lib/actions/appearance.actions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

type Theme = "light" | "dark" | "neon";

function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { settings, setSettings } = useAppearance();
  const [theme, setTheme] = useState<Theme>("light");
  const [api, setApi] = useState("");
  const [saved, setSaved] = useState(false);

  const [storeIdentity, setStoreIdentity] = useState({
    storeName: settings.navigation.storeName || "اندكس ستور",
    storeDescription: settings.navigation.footerDescription || "المتجر اليمني الإلكتروني الرائد للتسوق الفاخر والتجربة ثلاثية الأبعاد.",
    logo: settings.navigation.logoUrl || "",
    favicon: "/favicon.ico",
    country: "اليمن 🇾🇪",
    currency: "YER",
    timezone: "Asia/Aden",
    language: "ar",
    email: settings.navigation.supportEmail || "info@indexes-store.com",
    phone: settings.navigation.whatsappPhone || "967771370740",
    address: settings.navigation.addressText || "صنعاء - شارع بينون - مقابل صيدلية الرعاية الصحية",
    workingHours: "يومياً 9:00 ص - 10:00 م",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const th = (localStorage.getItem("noqta:theme") as Theme | null) ?? "light";
    setTheme(th);
    setApi(localStorage.getItem("noqta:api") ?? "");
    applyTheme(th);
  }, []);

  const applyTheme = (th: Theme) => {
    const root = document.documentElement;
    root.classList.remove("dark", "neon");
    if (th === "dark") root.classList.add("dark");
    if (th === "neon") root.classList.add("dark", "neon");
  };

  const save = async () => {
    localStorage.setItem("noqta:theme", theme);
    localStorage.setItem("noqta:api", api);
    applyTheme(theme);

    const newNav = {
      ...settings.navigation,
      storeName: storeIdentity.storeName,
      footerDescription: storeIdentity.storeDescription,
      logoUrl: storeIdentity.logo,
      whatsappPhone: storeIdentity.phone,
      supportEmail: storeIdentity.email,
      addressText: storeIdentity.address,
    };

    setSettings({ ...settings, navigation: newNav });
    try {
      await saveStorefrontDraft({ data: { key: "navigation", value: newNav } });
      toast.success("تم حفظ إعدادات الهوية والمتجر بنجاح");
    } catch {
      /* ignore */
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const themes: { id: Theme; label: string; icon: typeof Sun }[] = [
    { id: "light", label: t("settings.theme.light"), icon: Sun },
    { id: "dark", label: t("settings.theme.dark"), icon: Moon },
    { id: "neon", label: t("settings.theme.neon"), icon: Zap },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black lg:text-4xl text-foreground">{t("settings.title")}</h1>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-black">{t("settings.theme")}</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
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

      {/* Store Identity (Phase 1) */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div>
          <h2 className="text-base font-black text-foreground">هوية وإعدادات المتجر (Store Identity)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">البيانات الأساسية التي تظهر في الهيدر والفوتر والصفحات التعريفية</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">اسم المتجر (storeName)</label>
            <input
              value={storeIdentity.storeName}
              onChange={(e) => setStoreIdentity({ ...storeIdentity, storeName: e.target.value })}
              placeholder="اندكس ستور"
              className="w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">وصف المتجر (storeDescription)</label>
            <input
              value={storeIdentity.storeDescription}
              onChange={(e) => setStoreIdentity({ ...storeIdentity, storeDescription: e.target.value })}
              placeholder="المتجر اليمني الإلكتروني الرائد للتسوق الفاخر والتجربة ثلاثية الأبعاد."
              className="w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">رابط الشعار (logo)</label>
            <input
              value={storeIdentity.logo}
              onChange={(e) => setStoreIdentity({ ...storeIdentity, logo: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-primary/30"
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">أيقونة المتجر (favicon)</label>
            <input
              value={storeIdentity.favicon}
              onChange={(e) => setStoreIdentity({ ...storeIdentity, favicon: e.target.value })}
              placeholder="https://.../favicon.ico"
              className="w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-primary/30"
              dir="ltr"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">الدولة (country)</label>
            <input
              value={storeIdentity.country}
              onChange={(e) => setStoreIdentity({ ...storeIdentity, country: e.target.value })}
              placeholder="اليمن 🇾🇪"
              className="w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">العملة (currency)</label>
            <select
              value={storeIdentity.currency}
              onChange={(e) => setStoreIdentity({ ...storeIdentity, currency: e.target.value })}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="YER">YER (ريال يمني)</option>
              <option value="SAR">SAR (ريال سعودي)</option>
              <option value="USD">USD (دولار أمريكي)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">المنطقة الزمنية (timezone)</label>
            <input
              value={storeIdentity.timezone}
              onChange={(e) => setStoreIdentity({ ...storeIdentity, timezone: e.target.value })}
              placeholder="Asia/Aden"
              className="w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-primary/30"
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">اللغة الافتراضية (language)</label>
            <select
              value={storeIdentity.language}
              onChange={(e) => setStoreIdentity({ ...storeIdentity, language: e.target.value })}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="ar">العربية (Arabic)</option>
              <option value="en">English (الإنجليزية)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">رقم الهاتف والواتساب (phone)</label>
            <input
              value={storeIdentity.phone}
              onChange={(e) => setStoreIdentity({ ...storeIdentity, phone: e.target.value })}
              placeholder="967771370740"
              className="w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-primary/30"
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">البريد الإلكتروني (email)</label>
            <input
              value={storeIdentity.email}
              onChange={(e) => setStoreIdentity({ ...storeIdentity, email: e.target.value })}
              placeholder="info@indexes-store.com"
              className="w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-primary/30"
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">العنوان (address)</label>
            <input
              value={storeIdentity.address}
              onChange={(e) => setStoreIdentity({ ...storeIdentity, address: e.target.value })}
              placeholder="صنعاء - شارع بينون..."
              className="w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">ساعات العمل (workingHours)</label>
            <input
              value={storeIdentity.workingHours}
              onChange={(e) => setStoreIdentity({ ...storeIdentity, workingHours: e.target.value })}
              placeholder="يومياً 9:00 ص - 10:00 م"
              className="w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand hover:bg-primary/90 transition"
        >
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
