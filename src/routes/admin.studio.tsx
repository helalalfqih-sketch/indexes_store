import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Sparkles, Upload, X, Wand2, Save, RotateCcw, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAdmin, type AdminProduct } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/studio")({
  component: StudioPage,
});

type AIResult = {
  title: string;
  description: string;
  category: string;
  slug: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  priceEstimate: { min: number; max: number; currency: string };
};

function StudioPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIResult | null>(null);
  const addProduct = useAdmin((s) => s.addProduct);
  const addSession = useAdmin((s) => s.addSession);
  const updateSession = useAdmin((s) => s.updateSession);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 6);
    const dataUrls = await Promise.all(
      arr.map(
        (f) =>
          new Promise<string>((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.onerror = rej;
            r.readAsDataURL(f);
          }),
      ),
    );
    setImages((prev) => [...prev, ...dataUrls].slice(0, 6));
  };

  const analyze = async () => {
    setError(null);
    if (!images.length && !hint.trim()) {
      setError(lang === "ar" ? "أضف صورة أو تلميحاً على الأقل" : "Add an image or a hint first");
      return;
    }
    setLoading(true);
    setResult(null);
    const sessionId = crypto.randomUUID();
    addSession({
      id: sessionId,
      step: "processing",
      title: hint || (lang === "ar" ? "جلسة جديدة" : "New session"),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    try {
      const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
      const res = await fetch(`${base}/api/ai/analyze-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hint, language: lang, images }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setResult(data as AIResult);
      updateSession(sessionId, { step: "review", title: data.title });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      updateSession(sessionId, { step: "upload" });
    } finally {
      setLoading(false);
    }
  };

  const save = () => {
    if (!result) return;
    const id = crypto.randomUUID();
    const product: AdminProduct = {
      id,
      title: result.title,
      description: result.description,
      category: result.category,
      slug: result.slug,
      tags: result.tags,
      seoTitle: result.seoTitle,
      seoDescription: result.seoDescription,
      priceMin: result.priceEstimate.min,
      priceMax: result.priceEstimate.max,
      currency: result.priceEstimate.currency,
      images,
      status: "draft",
      createdAt: Date.now(),
    };
    addProduct(product);
    navigate({ to: "/admin/product/$id", params: { id } });
  };

  const reset = () => {
    setImages([]);
    setHint("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <Sparkles className="h-3.5 w-3.5" /> AI Studio
        </div>
        <h1 className="mt-3 text-3xl font-black lg:text-4xl">
          <span className="neon-text">{t("studio.title")}</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("studio.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Uploader */}
        <div className="rounded-2xl glass p-5">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            className="group cursor-pointer rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-8 text-center transition hover:bg-primary/10"
          >
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-brand shadow-brand">
              <Upload className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="mt-3 text-sm font-bold">{t("studio.drop")}</div>
            <div className="mt-1 text-xs text-muted-foreground">PNG · JPG · WEBP · ≤ 6</div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {images.map((src, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-border/60">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute end-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
                    aria-label="remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5">
            <label className="text-xs font-bold text-muted-foreground">{t("studio.hint")}</label>
            <textarea
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              rows={3}
              placeholder={t("studio.hintPh")}
              className="mt-2 w-full rounded-xl border border-border bg-surface p-3 text-sm outline-none ring-primary/30 focus:ring-2"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={analyze}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {loading ? t("studio.analyzing") : t("studio.analyze")}
            </button>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold hover:bg-accent"
            >
              <RotateCcw className="h-4 w-4" />
              {t("studio.reset")}
            </button>
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs font-bold text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Result */}
        <div className="rounded-2xl glass p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">{t("studio.result")}</h2>
            {result && (
              <button
                onClick={save}
                className="inline-flex items-center gap-2 rounded-xl bg-success px-4 py-2 text-sm font-bold text-success-foreground hover:opacity-90"
              >
                <Save className="h-4 w-4" />
                {t("studio.save")}
              </button>
            )}
          </div>

          {loading && (
            <div className="mt-6 space-y-3">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full gradient-brand animate-pulse-glow">
                <Sparkles className="h-8 w-8 text-primary-foreground animate-pulse" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {lang === "ar" ? "الذكاء يفكر..." : "AI is thinking..."}
              </p>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 animate-pulse rounded-lg bg-muted" style={{ width: `${90 - i * 12}%` }} />
                ))}
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {lang === "ar"
                ? "ستظهر بيانات المنتج المقترحة هنا بعد التحليل."
                : "AI-generated product details will appear here."}
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-3 text-sm">
              <Field label={t("studio.title2")} value={result.title} />
              <Field label={t("studio.desc")} value={result.description} multiline />
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("studio.category")} value={result.category} />
                <Field label={t("studio.slug")} value={result.slug} mono />
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground">{t("studio.tags")}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {result.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-accent/40 p-3">
                <div className="text-xs font-bold text-muted-foreground">{t("studio.seo")}</div>
                <div className="mt-1 text-sm font-bold">{result.seoTitle}</div>
                <div className="text-xs text-muted-foreground">{result.seoDescription}</div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-primary/15 to-fuchsia-500/10 p-4">
                <div className="text-xs font-bold text-muted-foreground">{t("studio.price")}</div>
                <div className="mt-1 text-2xl font-black neon-text">
                  {result.priceEstimate.min} – {result.priceEstimate.max} {result.priceEstimate.currency}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, multiline, mono }: { label: string; value: string; multiline?: boolean; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs font-bold text-muted-foreground">{label}</div>
      <div
        className={`mt-1 rounded-xl border border-border/60 bg-surface p-3 text-sm ${mono ? "font-mono" : ""} ${
          multiline ? "" : "truncate"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
