import { createFileRoute } from "@tanstack/react-router";
import { clearCustomerCookies, getCustomerSession, logoutUrl } from "@/lib/shopify/customer.server";

export const Route = createFileRoute("/api/customer/logout")({ server: { handlers: { GET: async ({ request }) => {
  const current = await getCustomerSession(request);
  const headers = new Headers({ Location: await logoutUrl(current?.session.idToken), "Cache-Control": "no-store" });
  for (const cookie of clearCustomerCookies()) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
} } } });
