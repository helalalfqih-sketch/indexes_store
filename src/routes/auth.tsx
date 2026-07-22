import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { signInSchema, signUpSchema } from "@/lib/validators/auth";

const searchSchema = z.object({
  next: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — اندكس ستور" },
      { name: "description", content: "سجّل الدخول أو أنشئ حساباً جديداً في اندكس ستور." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s): z.infer<typeof searchSchema> => {
    const r = searchSchema.safeParse(s);
    return r.success ? r.data : {};
  },
  component: AuthPage,
});

/** Map Supabase/OAuth errors to friendly Arabic messages. Zod issues pass through (already Arabic). */
function mapAuthError(err: unknown): string {
  if (err instanceof z.ZodError) return err.issues[0]?.message ?? "بيانات غير صالحة";
  const msg = err instanceof Error ? err.message : String(err);
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "بيانات الدخول غير صحيحة — تحقق من البريد وكلمة المرور.";
  if (m.includes("already registered") || m.includes("already exists"))
    return "هذا البريد مسجَّل مسبقاً — جرّب تسجيل الدخول.";
  if (m.includes("email not confirmed")) return "بريدك غير مؤكَّد بعد — افتح رسالة التأكيد في صندوق بريدك.";
  if (m.includes("password should be")) return "كلمة المرور ضعيفة — 8 أحرف على الأقل مع حرف ورقم.";
  if (m.includes("rate limit") || m.includes("too many")) return "محاولات كثيرة — انتظر قليلاً ثم أعد المحاولة.";
  if (m.includes("access_denied") || m.includes("cancelled") || m.includes("canceled"))
    return "تم إلغاء تسجيل الدخول.";
  if (m.includes("failed to fetch") || m.includes("network")) return "تعذّر الاتصال بالخادم — تحقق من الإنترنت.";
  return msg;
}

function sanitizeNext(next?: string): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

/** Post-login destination: explicit ?next= wins; otherwise admins → /admin, customers → /account. */
async function resolveDestination(userId: string, next?: string): Promise<string> {
  const safeNext = sanitizeNext(next);
  if (safeNext) return safeNext;
  try {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if ((data ?? []).some((r) => r.role === "admin")) return "/admin";
  } catch {
    /* role lookup is best-effort — default to customer destination */
  }
  return "/account";
}

function AuthPage() {
  const navigate = useNavigate();
  const { next, error: oauthError, error_description: oauthErrorDesc } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  // Surface OAuth callback errors (e.g. cancelled Google login) in Arabic.
  useEffect(() => {
    if (oauthError || oauthErrorDesc) {
      setError(mapAuthError(new Error(oauthErrorDesc || oauthError || "")));
    }
  }, [oauthError, oauthErrorDesc]);

  // Redirect signed-in users away from /auth — role-aware (admin → /admin, customer → /account).
  // This effect is also the OAuth callback handler: the Lovable broker returns to /auth,
  // the session is set, SIGNED_IN fires here, and the user is routed by role.
  useEffect(() => {
    let active = true;
    const go = async (userId: string) => {
      const dest = await resolveDestination(userId, next);
      if (active) navigate({ to: dest, replace: true });
    };
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go(data.session.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) go(session.user.id);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate, next]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const input = signInSchema.parse({ email, password });
        const { error } = await supabase.auth.signInWithPassword(input);
        if (error) throw error;
        // Redirect handled by the SIGNED_IN listener (role-aware).
      } else {
        const base = import.meta.env.BASE_URL || "/";
        const cleanBase = base.replace(/\/$/, "");
        const redirectUrl = window.location.origin + cleanBase + "/auth";

        const input = signUpSchema.parse({
          email,
          password,
          confirm_password: confirmPassword,
          full_name: fullName,
          phone,
        });
        const { data, error } = await supabase.auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            // Profile fields travel as auth metadata; the DB trigger
            // handle_new_user creates the profiles row from auth.uid() —
            // the client never supplies a user id.
            data: { full_name: input.full_name, phone: input.phone ?? null },
            emailRedirectTo: redirectUrl,
          },
        });
        if (error) throw error;
        // Supabase anti-enumeration: existing confirmed email returns a user
        // with an empty identities array and NO error.
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          throw new Error("already registered");
        }
        if (data.user && !data.session) {
          // Email confirmation required.
          setInfo("تم إنشاء حسابك! افتح بريدك الإلكتروني واضغط رابط التأكيد، ثم سجّل الدخول.");
          setMode("signin");
          setPassword("");
          setConfirmPassword("");
        }
        // If a session exists, the SIGNED_IN listener redirects.
      }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    setInfo(null);
    setGoogleBusy(true);
    try {
      const base = import.meta.env.BASE_URL || "/";
      const cleanBase = base.replace(/\/$/, "");
      const redirectUrl = window.location.origin + cleanBase + "/auth";

      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: redirectUrl,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) setError(mapAuthError(result.error));
      // If result.redirected: browser navigates away. Otherwise the SIGNED_IN
      // listener above performs the role-aware redirect.
    } finally {
      setGoogleBusy(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors";

  return (
    <div
      className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-12"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-black tracking-tight">اندكس ستور</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "أهلاً بعودتك، سجّل دخولك للمتابعة" : "أنشئ حساباً جديداً"}
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
            }}
            className={`rounded-lg py-2 font-semibold transition ${
              mode === "signin"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`rounded-lg py-2 font-semibold transition ${
              mode === "signup"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            إنشاء حساب
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "signup" && (
            <>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="الاسم الكامل"
                aria-label="الاسم الكامل"
                autoComplete="name"
                required
                className={inputClass}
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="رقم الهاتف (اختياري)"
                aria-label="رقم الهاتف (اختياري)"
                autoComplete="tel"
                dir="ltr"
                className={`${inputClass} text-right`}
              />
            </>
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
            aria-label="البريد الإلكتروني"
            autoComplete="email"
            required
            className={inputClass}
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              aria-label="كلمة المرور"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={8}
              className={`${inputClass} pl-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {mode === "signup" && (
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="تأكيد كلمة المرور"
              aria-label="تأكيد كلمة المرور"
              autoComplete="new-password"
              required
              minLength={8}
              className={inputClass}
            />
          )}

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {error}
            </div>
          )}
          {info && (
            <div
              role="status"
              className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success"
            >
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || googleBusy}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "جارٍ المعالجة..." : mode === "signin" ? "دخول" : "إنشاء حساب"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>أو</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={onGoogle}
          disabled={busy || googleBusy}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface py-3 text-sm font-semibold transition hover:bg-accent disabled:opacity-60"
        >
          {googleBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.3 12 2.3 6.7 2.3 2.5 6.6 2.5 12s4.3 9.7 9.5 9.7c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6z"
              />
            </svg>
          )}
          {googleBusy ? "جارٍ التحويل..." : "متابعة عبر Google"}
        </button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            ← العودة للمتجر
          </Link>
        </p>
      </div>
    </div>
  );
}
