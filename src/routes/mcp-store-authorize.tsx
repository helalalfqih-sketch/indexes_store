import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/mcp-store-authorize")({
  validateSearch: (search: Record<string, unknown>) => ({
    client_id: String(search.client_id || ""),
    redirect_uri: String(search.redirect_uri || ""),
    state: String(search.state || ""),
    code_challenge: String(search.code_challenge || ""),
  }),
  component: StoreMcpAuthorize,
});

function StoreMcpAuthorize() {
  const query = Route.useSearch();
  const navigate = useNavigate();
  const [status, setStatus] = useState("جارٍ التحقق من صلاحية حساب الإدارة…");

  useEffect(() => {
    void (async () => {
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
        return;
      }
      const body = (await response.json()) as { redirect: string };
      window.location.assign(body.redirect);
    })();
  }, [navigate, query]);

  return (
    <main className="min-h-screen grid place-items-center p-6" dir="rtl">
      <section className="max-w-md rounded-xl border p-6">
        <h1 className="text-xl font-bold">ربط إدارة اندكس ستور</h1>
        <p className="mt-3 text-sm">{status}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          صلاحية قراءة فقط ومقيدة بمتجرك. لا تعديل ولا حذف ولا نشر.
        </p>
      </section>
    </main>
  );
}
