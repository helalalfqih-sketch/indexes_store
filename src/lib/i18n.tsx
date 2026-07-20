import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

const dict: Dict = {
  "nav.dashboard": { ar: "لوحة التحكم", en: "Dashboard" },
  "nav.studio": { ar: "استوديو AI", en: "AI Studio" },
  "nav.products": { ar: "المنتجات", en: "Products" },
  "nav.sessions": { ar: "الجلسات", en: "Sessions" },
  "nav.settings": { ar: "الإعدادات", en: "Settings" },
  "nav.appearance": { ar: "مظهر المتجر", en: "Store Appearance" },
  "nav.storefront": { ar: "المتجر", en: "Storefront" },
  "brand.tagline": { ar: "لوحة اندكس ستور الذكية", en: "Indexes Store Intelligence" },
  "dash.revenue": { ar: "الإيرادات", en: "Revenue" },
  "dash.orders": { ar: "الطلبات", en: "Orders" },
  "dash.products": { ar: "المنتجات", en: "Products" },
  "dash.customers": { ar: "العملاء", en: "Customers" },
  "dash.aiInsights": { ar: "رؤى الذكاء", en: "AI Insights" },
  "dash.performance": { ar: "أداء المتجر", en: "Store Performance" },
  "dash.topProducts": { ar: "المنتجات الأعلى", en: "Top Products" },
  "dash.recentSessions": { ar: "أحدث الجلسات", en: "Recent Sessions" },
  "studio.title": { ar: "استوديو المنتجات الذكي", en: "AI Product Studio" },
  "studio.subtitle": { ar: "ارفع صور المنتج ودع الذكاء يكتب كل شيء", en: "Upload images and let AI craft the listing" },
  "studio.drop": { ar: "اسحب الصور هنا أو انقر للرفع", en: "Drop images here or click to upload" },
  "studio.hint": { ar: "تلميح للذكاء (اختياري)", en: "Hint for AI (optional)" },
  "studio.hintPh": { ar: "مثلاً: ساعة رياضية مقاومة للماء", en: "e.g. Waterproof sports watch" },
  "studio.analyze": { ar: "تحليل بالذكاء", en: "Analyze with AI" },
  "studio.analyzing": { ar: "جاري التحليل...", en: "Analyzing..." },
  "studio.result": { ar: "النتيجة", en: "Result" },
  "studio.save": { ar: "حفظ كمنتج", en: "Save product" },
  "studio.reset": { ar: "إعادة تعيين", en: "Reset" },
  "studio.title2": { ar: "عنوان المنتج", en: "Product Title" },
  "studio.desc": { ar: "الوصف", en: "Description" },
  "studio.category": { ar: "التصنيف", en: "Category" },
  "studio.slug": { ar: "الرابط", en: "Slug" },
  "studio.tags": { ar: "الوسوم", en: "Tags" },
  "studio.seo": { ar: "SEO", en: "SEO" },
  "studio.price": { ar: "السعر المقترح", en: "Price Suggestion" },
  "studio.before": { ar: "قبل", en: "Before" },
  "studio.after": { ar: "بعد", en: "After" },
  "products.title": { ar: "المنتجات", en: "Products" },
  "products.empty": { ar: "لا توجد منتجات بعد — أنشئ واحداً من الاستوديو", en: "No products yet — create one from Studio" },
  "products.status.draft": { ar: "مسودة", en: "Draft" },
  "products.status.published": { ar: "منشور", en: "Published" },
  "products.status.processing": { ar: "قيد المعالجة", en: "Processing" },
  "products.view": { ar: "عرض", en: "View" },
  "products.publish": { ar: "نشر", en: "Publish" },
  "products.delete": { ar: "حذف", en: "Delete" },
  "sessions.title": { ar: "جلسات الذكاء", en: "AI Sessions" },
  "sessions.step.upload": { ar: "رفع", en: "Upload" },
  "sessions.step.processing": { ar: "معالجة", en: "AI Processing" },
  "sessions.step.review": { ar: "مراجعة", en: "Review" },
  "sessions.step.approved": { ar: "معتمد", en: "Approved" },
  "sessions.step.published": { ar: "منشور", en: "Published" },
  "settings.title": { ar: "الإعدادات", en: "Settings" },
  "settings.theme": { ar: "المظهر", en: "Theme" },
  "settings.theme.dark": { ar: "داكن", en: "Dark" },
  "settings.theme.light": { ar: "فاتح", en: "Light" },
  "settings.theme.neon": { ar: "نيون", en: "Neon" },
  "settings.lang": { ar: "اللغة", en: "Language" },
  "settings.api": { ar: "رابط الـ API", en: "API Endpoint" },
  "settings.saved": { ar: "تم الحفظ", en: "Saved" },
  "settings.save": { ar: "حفظ", en: "Save" },
  "common.back": { ar: "رجوع", en: "Back" },
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: keyof typeof dict | string) => string;
  dir: "rtl" | "ltr";
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = (localStorage.getItem("noqta:lang") as Lang | null) ?? "ar";
    setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("noqta:lang", l);
  };

  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";

  const t = (k: string) => {
    const entry = (dict as Dict)[k];
    return entry ? entry[lang] : k;
  };

  return <I18nContext.Provider value={{ lang, setLang, t, dir }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be inside I18nProvider");
  return ctx;
}
