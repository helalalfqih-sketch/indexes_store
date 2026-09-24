import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/mcp-store-authorize")({
  validateSearch: (search: Record<string, unknown>) => ({
    scope: String(search.scope || "store.read"),
    client_id: String(search.client_id || ""),
    redirect_uri: String(search.redirect_uri || ""),
    state: String(search.state || ""),
    code_challenge: String(search.code_challenge || ""),
  }),
  component: StoreMcpAuthorize,
});

const capabilityGroups = [
  {
    title: "فحص المتجر والبيانات",
    items: ["صحة المتجر وShopify", "المنتجات والكتالوج والمخزون", "الطلبات والصفحات وسجل التدقيق"],
  },
  {
    title: "فحص الواجهة والمتصفح",
    items: ["فحص الصفحات والعناصر والنماذج", "فحص Desktop وMobile", "Console وNetwork"],
  },
  {
    title: "اختبار تفاعل معزول",
    items: ["السماح باستخدام أدوات اختبار التفاعل التي تتطلب هذه الصلاحية عند توفرها"],
  },
  {
    title: "تطوير المصدر عبر GitHub",
    items: [
      "قراءة والبحث في الكود",
      "ربط عناصر الواجهة بملفات المصدر",
      "إنشاء agent/* branch",
      "تعديل ملف مع SHA guard",
      "إنشاء Draft Pull Request",
    ],
  },
  {
    title: "التحقق قبل الإصدار",
    items: [
      "فحص PR ونتائج CI",
      "مقارنة Production وPreview",
      "Release readiness",
      "التحقق من مصدر Production",
    ],
  },
] as const;

function StoreMcpAuthorize() {
  const query = Route.useSearch();
  const navigate = useNavigate();
  const [status, setStatus] = useState("راجع الصلاحيات ثم وافق على الربط.");
  const [busy, setBusy] = useState(false);

  async function approve() {
    setBusy(true);
    setStatus("جارٍ التحقق من صلاحية حساب الإدارة…");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = `/mcp-store-authorize?${new URLSearchParams(query).toString()}`;
      await navigate({ to: "/auth", search: { next } });
      return;
    }
    const response = await fetch("/api/mcp/store/oauth/approve", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    });
    if (!response.ok) {
      setStatus("هذا الحساب غير مخول لربط إدارة المتجر.");
      setBusy(false);
      return;
    }
    const body = (await response.json()) as { redirect: string };
    window.location.assign(body.redirect);
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6" dir="rtl">
      <section className="mx-auto max-w-2xl rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
        <h1 className="text-2xl font-bold">ربط Indexes Store Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          الصلاحيات المطلوبة لهذا الاتصال: {query.scope}
        </p>

        <div className="mt-6 space-y-4">
          {capabilityGroups
            .filter(
              (group) =>
                (group.title !== "تطوير المصدر عبر GitHub" ||
                  query.scope.split(" ").includes("store.develop")) &&
                (group.title !== "اختبار تفاعل معزول" ||
                  query.scope.split(" ").includes("store.test")),
            )
            .map((group) => (
              <section key={group.title} className="rounded-xl border p-4">
                <h2 className="font-semibold">{group.title}</h2>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {group.items.map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
              </section>
            ))}
        </div>

        <div className="mt-5 rounded-xl border p-4 text-sm">
          <p className="font-semibold">حواجز الأمان</p>
          <p className="mt-1 text-muted-foreground">
            لا كتابة مباشرة إلى main، ولا Merge أو Production Deploy أو migrations أو قراءة أسرار.
            تعديلات المصدر محصورة في فروع agent/* وDraft PRs مع تحقق SHA.
          </p>
        </div>

        <p className="mt-4 text-sm" aria-live="polite">
          {status}
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void approve()}
            disabled={busy}
            className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "جارٍ الربط…" : "موافقة وربط"}
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            disabled={busy}
            className="rounded-xl border px-5 py-3 font-semibold"
          >
            إلغاء
          </button>
        </div>
      </section>
    </main>
  );
}
