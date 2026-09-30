import { createFileRoute } from "@tanstack/react-router";
import { completeTikTokOAuth } from "@/lib/tiktok.server";

function safeReason(error: unknown): string {
  const value = error instanceof Error ? error.message : "TIKTOK_OAUTH_FAILED";
  const sanitized = value.replace(/[^A-Z0-9_:-]/gi, "").slice(0, 80);
  return sanitized || "TIKTOK_OAUTH_FAILED";
}

function resultPage(title: string, message: string, ok: boolean) {
  const accent = ok ? "#16a34a" : "#dc2626";
  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;background:#08090b;color:#f5f7fa;font-family:system-ui;min-height:100vh;display:grid;place-items:center">
  <main style="max-width:32rem;padding:2rem;text-align:center">
    <div style="width:4rem;height:4rem;border-radius:999px;background:${accent}22;border:1px solid ${accent}55;display:grid;place-items:center;margin:0 auto 1rem;font-size:2rem">
      ${ok ? "✓" : "!"}
    </div>
    <h1 style="margin:0 0 .75rem;font-size:1.5rem">${title}</h1>
    <p style="margin:0;color:#a1a1aa;line-height:1.8">${message}</p>
  </main>
</body>
</html>`;

  return new Response(html, {
    status: ok ? 200 : 400,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      Pragma: "no-cache",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export const Route = createFileRoute("/api/tiktok/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);

        if (url.searchParams.get("error")) {
          return resultPage(
            "لم يكتمل الربط",
            "تم إلغاء أو رفض تفويض TikTok. يمكنك إغلاق هذه الصفحة والمحاولة مرة أخرى من لوحة اندكس.",
            false,
          );
        }

        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (!code || !state) {
          return resultPage(
            "رابط غير صالح",
            "بيانات التفويض غير مكتملة. أغلق الصفحة واطلب QR جديدًا من لوحة اندكس.",
            false,
          );
        }

        try {
          await completeTikTokOAuth({ code, state });
          return resultPage(
            "تم ربط TikTok بنجاح",
            "يمكنك الآن إغلاق هذه الصفحة والعودة إلى الكمبيوتر. ستظهر حالة الحساب متصلًا تلقائيًا في لوحة اندكس.",
            true,
          );
        } catch (error) {
          console.error("[tiktok-oauth] callback failed", {
            reason: safeReason(error),
          });
          return resultPage(
            "تعذر إكمال الربط",
            "انتهت صلاحية QR أو تعذر التحقق من TikTok. أغلق الصفحة واطلب QR جديدًا من لوحة اندكس.",
            false,
          );
        }
      },
    },
  },
});
