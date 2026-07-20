import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";

export type AiAction =
  | "title"
  | "improveTitle"
  | "description"
  | "improveDescription"
  | "tags"
  | "seoTitle"
  | "seoDescription"
  | "category"
  | "brand"
  | "price"
  | "features"
  | "highlights"
  | "specs"
  | "fbAd"
  | "tiktokAd"
  | "instaCaption"
  | "translate"
  | "rewrite";

export type AiContext = {
  name: string;
  description: string;
  images: string[];
  brand?: string;
  price?: number;
  currency?: string;
};

export type AiApply = (action: AiAction, value: string | string[] | number) => void;

type AnalyzeResponse = {
  title: string;
  description: string;
  category: string;
  slug: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  priceEstimate: { min: number; max: number; currency: string };
};

async function callAnalyze(hint: string, images: string[]): Promise<AnalyzeResponse> {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const res = await fetch(`${base}/api/ai/analyze-product`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ hint, language: "ar", images: images.slice(0, 6) }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `AI error (${res.status})`);
  }
  return res.json();
}

const ACTIONS: {
  key: AiAction;
  label: string;
  description: string;
  needsImages?: boolean;
  needsText?: boolean;
}[] = [
  { key: "title", label: "توليد اسم", description: "اسم منتج جذاب من الصور" , needsImages: true },
  { key: "improveTitle", label: "تحسين الاسم", description: "إعادة صياغة الاسم الحالي", needsText: true },
  { key: "description", label: "توليد وصف", description: "وصف تسويقي كامل" },
  { key: "improveDescription", label: "تحسين الوصف", description: "تنقيح الوصف الحالي", needsText: true },
  { key: "tags", label: "توليد وسوم", description: "كلمات مفتاحية للبحث" },
  { key: "seoTitle", label: "عنوان SEO", description: "عنوان محرك بحث محسّن" },
  { key: "seoDescription", label: "وصف SEO", description: "وصف Meta للمتاجر" },
  { key: "category", label: "اقتراح تصنيف", description: "أنسب تصنيف من الصور" },
  { key: "brand", label: "اقتراح ماركة", description: "استخراج الماركة من الصور", needsImages: true },
  { key: "price", label: "اقتراح سعر", description: "سعر بيع تقديري" },
  { key: "features", label: "استخراج مزايا", description: "قائمة مزايا رئيسية" },
  { key: "highlights", label: "نقاط تسويقية", description: "3 نقاط بيع قوية" },
  { key: "specs", label: "المواصفات", description: "مواصفات تقنية منظمة" },
  { key: "fbAd", label: "إعلان فيسبوك", description: "نص إعلاني ترويجي للفيسبوك" },
  { key: "tiktokAd", label: "إعلان تيك توك", description: "سيناريو إعلان تيك توك جذاب" },
  { key: "instaCaption", label: "كابشن انستقرام", description: "Caption جاهز للنشر مع الهاشتاغات" },
  { key: "translate", label: "ترجمة المنتج", description: "ترجمة الاسم والوصف للغة الأخرى" },
  { key: "rewrite", label: "إعادة صياغة", description: "إعادة صياغة الوصف بأسلوب مميز" },
];

function buildHint(action: AiAction, ctx: AiContext): string {
  const parts: string[] = [];
  if (ctx.name) parts.push(`الاسم الحالي: ${ctx.name}`);
  if (ctx.brand) parts.push(`الماركة: ${ctx.brand}`);
  if (ctx.description) parts.push(`الوصف الحالي: ${ctx.description.slice(0, 400)}`);
  switch (action) {
    case "improveTitle":
      parts.push("المطلوب: إعادة صياغة الاسم ليكون أكثر جاذبية وقصر (< 60 حرف).");
      break;
    case "improveDescription":
      parts.push("المطلوب: تحسين الوصف الحالي مع إبراز الفوائد.");
      break;
    case "features":
      parts.push("المطلوب: استخراج 4-6 مزايا رئيسية على شكل نقاط.");
      break;
    case "highlights":
      parts.push("المطلوب: 3 نقاط بيع قوية للتسويق.");
      break;
    case "specs":
      parts.push("المطلوب: مواصفات تقنية بصيغة قائمة (المفتاح: القيمة).");
      break;
    case "fbAd":
      parts.push("المطلوب: إنشاء نص إعلان ترويجي احترافي ومقنع للفيسبوك لزيادة المبيعات، مع استخدام رموز تعبيرية (Emojis) ودعوة واضحة لاتخاذ إجراء (CTA).");
      break;
    case "tiktokAd":
      parts.push("المطلوب: كتابة سيناريو فيديو إعلاني قصير وتفاعلي لـ TikTok (مشهد وصوت) مع الهاشتاغات الرائجة.");
      break;
    case "instaCaption":
      parts.push("المطلوب: كتابة كابشن (Caption) تفاعلي وجذاب لمنشور انستقرام لهذا المنتج مع هاشتاغات مستهدفة.");
      break;
    case "translate":
      parts.push("المطلوب: ترجمة اسم ووصف المنتج بدقة واحترافية للغة الإنجليزية (أو العكس إذا كان بالإنجليزية).");
      break;
    case "rewrite":
      parts.push("المطلوب: إعادة صياغة محتوى بطاقة المنتج الحالي بأسلوب لغوي راقٍ وأكثر إقناعاً.");
      break;
    default:
      break;
  }
  return parts.join("\n");
}

function extractValue(
  action: AiAction,
  data: AnalyzeResponse,
  ctx: AiContext,
): string | string[] | number {
  switch (action) {
    case "title":
    case "improveTitle":
      return data.title;
    case "description":
    case "improveDescription":
    case "features":
    case "highlights":
    case "specs":
    case "fbAd":
    case "tiktokAd":
    case "instaCaption":
    case "translate":
    case "rewrite":
      // Reuse description slot; formatted list from AI description
      return data.description;
    case "tags":
      return data.tags;
    case "seoTitle":
      return data.seoTitle;
    case "seoDescription":
      return data.seoDescription;
    case "category":
      return data.category;
    case "brand":
      // Model doesn't return brand; use first tag as a lightweight suggestion
      return data.tags[0] ?? ctx.brand ?? "";
    case "price": {
      const currency = data.priceEstimate?.currency || ctx.currency || "YER";
      const mid = Math.round(
        ((data.priceEstimate?.min ?? 0) + (data.priceEstimate?.max ?? 0)) / 2,
      );
      // Return numeric mid as price suggestion; UI will format
      return mid || 0;
    }
    default:
      return "";
  }
}

export function AiAssistantPanel({
  context,
  onApply,
}: {
  context: AiContext;
  onApply: AiApply;
}) {
  const [busy, setBusy] = useState<AiAction | null>(null);
  const [done, setDone] = useState<Record<string, number>>({});

  const run = async (action: AiAction) => {
    const meta = ACTIONS.find((a) => a.key === action)!;
    if (context.images.length === 0 && !context.name.trim()) {
      toast.error("يرجى إضافة صورة للمنتج أو كتابة اسمه أولاً للبدء");
      return;
    }
    if (meta.needsImages && context.images.length === 0) {
      toast.error("أضف صورة واحدة على الأقل أولاً");
      return;
    }
    setBusy(action);
    try {
      const data = await callAnalyze(buildHint(action, context), context.images);
      const value = extractValue(action, data, context);
      onApply(action, value);
      setDone((d) => ({ ...d, [action]: Date.now() }));
      toast.success(`تم: ${meta.label}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "خطأ";
      toast.error(`${meta.label}: ${msg}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-gradient-to-br from-primary/10 to-fuchsia-500/10 p-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-xs font-bold">
            المساعد الذكي يولّد المحتوى من الصور والاسم الحالي
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ACTIONS.map((a) => {
          const isBusy = busy === a.key;
          const wasDone = done[a.key];
          const disabled = busy !== null;
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => run(a.key)}
              disabled={disabled}
              className="group relative flex items-start gap-3 rounded-xl border border-border bg-surface p-3 text-start transition hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                {isBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : wasDone ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-black">{a.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {a.description}
                </span>
              </span>
              {wasDone && !isBusy && (
                <RefreshCw className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        كل إجراء يعمل بشكل مستقل. تكلفة صغيرة لكل تنفيذ.
      </p>
    </div>
  );
}
