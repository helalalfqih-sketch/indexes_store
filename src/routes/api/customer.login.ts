import { createFileRoute } from "@tanstack/react-router";
import { beginCustomerLogin, oauthCookie } from "@/lib/shopify/customer.server";

export const Route = createFileRoute("/api/customer/login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const returnTo = new URL(request.url).searchParams.get("returnTo") || "/account";
          const { url, transaction } = await beginCustomerLogin(returnTo);
          return new Response(null, {
            status: 302,
            headers: {
              Location: url,
              "Set-Cookie": oauthCookie(transaction),
              "Cache-Control": "no-store",
            },
          });
        } catch (error) {
          console.error("[customer-login] unable to start Shopify OAuth", {
            error: error instanceof Error ? error.message : String(error),
          });
          return new Response(
            `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>تعذر تسجيل الدخول</title><body style="margin:0;font-family:system-ui;background:#08090b;color:#f5f7fa;display:grid;min-height:100vh;place-items:center"><main style="max-width:30rem;padding:2rem;text-align:center"><h1>تعذر بدء تسجيل الدخول</h1><p>خدمة حساب العميل غير متاحة مؤقتًا. يمكنك متابعة التسوق والمحاولة لاحقًا.</p><a href="/" style="display:inline-block;background:#2563eb;color:white;padding:.8rem 1.2rem;border-radius:.75rem;text-decoration:none">العودة للمتجر</a></main></body></html>`,
            {
              status: 503,
              headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
            },
          );
        }
      },
    },
  },
});
