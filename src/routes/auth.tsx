import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { signInSchema, signUpSchema } from "@/lib/validators/auth";

const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — اندكس ستور" },
      { name: "description", content: "سجّل الدخول أو أنشئ حساباً جديداً في اندكس ستور." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Redirect signed-in users away from /auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: sanitizeNext(next), replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: sanitizeNext(next), replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, next]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const input = signInSchema.parse({ email, password });
        const { error } = await supabase.auth.signInWithPassword(input);
        if (error) throw error;
      } else {
        const base = import.meta.env.BASE_URL || "/";
        const cleanBase = base.replace(/\/$/, "");
        const redirectUrl = window.location.origin + cleanBase + "/auth";

        const input = signUpSchema.parse({ email, password, full_name: fullName });
        const { error } = await supabase.auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            data: { full_name: input.full_name },
            emailRedirectTo: redirectUrl,
          },
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    const base = import.meta.env.BASE_URL || "/";
    const cleanBase = base.replace(/\/$/, "");
    const redirectUrl = window.location.origin + cleanBase + "/auth";

    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: redirectUrl,
      extraParams: { prompt: "select_account" },
    });
    if (result.error) setError(result.error instanceof Error ? result.error.message : String(result.error));
    // If result.redirected: browser navigates away. Otherwise onAuthStateChange handles redirect.
  };

  return (
    <div className="min-h-screen bg-[#000209] text-[#EEEEEE] flex items-center justify-center px-4 py-12" dir="rtl">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-black">اندكس ستور</h1>
          <p className="mt-1 text-sm text-white/60">
            {mode === "signin" ? "أهلاً بعودتك، سجّل دخولك للمتابعة" : "أنشئ حساباً جديداً"}
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`rounded-lg py-2 font-semibold transition ${
              mode === "signin" ? "bg-white/10 text-white" : "text-white/60"
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-lg py-2 font-semibold transition ${
              mode === "signup" ? "bg-white/10 text-white" : "text-white/60"
            }`}
          >
            إنشاء حساب
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="الاسم الكامل"
              autoComplete="name"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
            autoComplete="email"
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={8}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
          />
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-white py-3 text-sm font-bold text-black transition hover:bg-white/90 disabled:opacity-60"
          >
            {busy ? "جارٍ..." : mode === "signin" ? "دخول" : "إنشاء حساب"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-white/40">
          <span className="h-px flex-1 bg-white/10" />
          <span>أو</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={onGoogle}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold transition hover:bg-white/10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.3 12 2.3 6.7 2.3 2.5 6.6 2.5 12s4.3 9.7 9.5 9.7c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6z"/>
          </svg>
          متابعة عبر Google
        </button>

        <p className="mt-6 text-center text-xs text-white/40">
          <Link to="/" className="hover:text-white">← العودة للمتجر</Link>
        </p>
      </div>
    </div>
  );
}

function sanitizeNext(next?: string): string {
  if (!next) return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}
