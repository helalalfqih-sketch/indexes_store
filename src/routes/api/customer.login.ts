import { createFileRoute } from "@tanstack/react-router";
import { beginCustomerLogin, oauthCookie } from "@/lib/shopify/customer.server";

export const Route = createFileRoute("/api/customer/login")({ server: { handlers: { GET: async ({ request }) => {
  const returnTo = new URL(request.url).searchParams.get("returnTo") || "/account";
  const { url, transaction } = await beginCustomerLogin(returnTo);
  return new Response(null, { status: 302, headers: { Location: url, "Set-Cookie": oauthCookie(transaction), "Cache-Control": "no-store" } });
} } } });
