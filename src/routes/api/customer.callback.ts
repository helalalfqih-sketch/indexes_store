import { createFileRoute } from "@tanstack/react-router";
import {
  clearCustomerCookies,
  finishCustomerLogin,
  sessionCookie,
} from "@/lib/shopify/customer.server";

export const Route = createFileRoute("/api/customer/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        try {
          const code = url.searchParams.get("code");
          const state = url.searchParams.get("state");
          if (!code || !state) throw new Error("Missing OAuth callback parameters");
          const result = await finishCustomerLogin(request, code, state);
          const headers = new Headers({ Location: result.returnTo, "Cache-Control": "no-store" });
          headers.append("Set-Cookie", sessionCookie(result.session));
          headers.append("Set-Cookie", clearCustomerCookies()[1]);
          return new Response(null, { status: 302, headers });
        } catch {
          return new Response(null, {
            status: 302,
            headers: { Location: "/account?auth=failed", "Set-Cookie": clearCustomerCookies()[1] },
          });
        }
      },
    },
  },
});
