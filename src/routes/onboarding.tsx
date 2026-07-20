import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useSession } from "@/hooks/use-session";
import {
  completeOnboarding,
  getOnboardingStatus,
  checkSlugAvailability,
} from "@/lib/onboarding.functions";
import { onboardingSchema, SLUG_REGEX } from "@/lib/validators/onboarding";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "أنشئ متجرك — اندكس ستور" },
      { name: "description", content: "أنشئ متجرك الخاص على منصة اندكس ستور خلال دقيقة." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingPage,
});

type Status =
  | { hasTenant: true; role: string; tenant: { id: string; slug: string; name: string } }
  | { hasTenant: false; role: null; tenant: null };

const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 32);

function OnboardingPage() {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();
  const getStatus = useServerFn(getOnboardingStatus);
  const checkSlug = useServerFn(checkSlugAvailability);
  const submit = useServerFn(completeOnboarding);

  const [status, setStatus] = useState<Status | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugState, setSlugState] = useState<
    { checking: boolean; available: boolean | null; reason: string | null }
  >({ checking: false, available: null, reason: null });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Auth gate (client-side; this route is public for SSR)
  useEffect(() => {
    if (!sessionLoading && !session) {
      navigate({ to: "/auth", search: { next: "/onboarding" }, replace: true });
    }
  }, [session, sessionLoading, navigate]);

  // Fetch onboarding status
  useEffect(() => {
    if (!session) return;
    setStatusLoading(true);
    getStatus()
      .then((s) => setStatus(s as Status))
      .catch((e) => setError(e instanceof Error ? e.message : "تعذّر تحميل الحالة"))
      .finally(() => setStatusLoading(false));
  }, [session, getStatus]);

  // Auto-slug from name until user edits slug directly
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  // Debounced slug availability check
  useEffect(() => {
    if (!slug || !SLUG_REGEX.test(slug)) {
      setSlugState({ checking: false, available: null, reason: null });
      return;
    }
    setSlugState((s) => ({ ...s, checking: true }));
    const t = setTimeout(async () => {
      try {
        const res = await checkSlug({ data: { slug } });
        setSlugState({ checking: false, available: res.available, reason: res.reason });
      } catch {
        setSlugState({ checking: false, available: null, reason: null });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [slug, checkSlug]);

  const canSubmit = useMemo(() => {
    const parsed = onboardingSchema.safeParse({ name, slug });
    return parsed.success && slugState.available === true && !busy;
  }, [name, slug, slugState.available, busy]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = onboardingSchema.safeParse({ name, slug });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }
    setBusy(true);
    try {
      const tenant = await submit({ data: parsed.data });
      navigate({ to: "/admin", search: { tenant: tenant.slug } as never, replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر إنشاء المتجر");
    } finally {
      setBusy(false);
    }
  }

  if (sessionLoading || statusLoading || !session) {
    return <CenteredMessage>جارٍ التحميل…</CenteredMessage>;
  }

  if (status?.hasTenant) {
    return (
      <CenteredCard>
        <h1 className="text-2xl font-semibold mb-2">لديك متجر بالفعل</h1>
        <p className="text-sm opacity-80 mb-4">
          المتجر: <span className="font-medium">{status.tenant.name}</span> (
          <code>{status.tenant.slug}</code>)
        </p>
        <div className="flex gap-3">
          <Link to="/admin" className="btn-primary">لوحة التحكم</Link>
          <Link to="/" className="btn-ghost">العودة للرئيسية</Link>
        </div>
      </CenteredCard>
    );
  }

  return (
    <CenteredCard>
      <h1 className="text-2xl font-semibold mb-1">أنشئ متجرك</h1>
      <p className="text-sm opacity-70 mb-6">
        دقيقة واحدة — اختر اسماً ومعرّفاً فريداً لمتجرك.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">اسم المتجر</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: متجر اندكس"
            className="input mt-1"
            required
            maxLength={80}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">المعرّف (Slug)</span>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="my-store"
              className="input flex-1"
              required
              minLength={3}
              maxLength={32}
              dir="ltr"
            />
            <span className="text-xs opacity-60">.noqta.app</span>
          </div>
          <SlugHint slug={slug} state={slugState} />
        </label>

        {error && (
          <div className="text-sm text-red-500 bg-red-500/10 rounded-md p-3">{error}</div>
        )}

        <button type="submit" disabled={!canSubmit} className="btn-primary w-full">
          {busy ? "جارٍ الإنشاء…" : "إنشاء المتجر"}
        </button>
      </form>
    </CenteredCard>
  );
}

function SlugHint({
  slug,
  state,
}: {
  slug: string;
  state: { checking: boolean; available: boolean | null; reason: string | null };
}) {
  if (!slug) return null;
  if (state.checking) return <p className="text-xs opacity-60 mt-1">جارٍ التحقق…</p>;
  if (state.available === true)
    return <p className="text-xs text-emerald-500 mt-1">المعرّف متاح ✓</p>;
  if (state.available === false)
    return (
      <p className="text-xs text-red-500 mt-1">
        {state.reason === "reserved" ? "هذا المعرّف محجوز" : "المعرّف مستخدم بالفعل"}
      </p>
    );
  return null;
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8 shadow-2xl">
        {children}
      </div>
    </main>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center text-sm opacity-70" dir="rtl">
      {children}
    </main>
  );
}
