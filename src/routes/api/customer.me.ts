import { createFileRoute } from "@tanstack/react-router";
import { customerGraphql, getCustomerSession, sessionCookie } from "@/lib/shopify/customer.server";

const CUSTOMER_QUERY = `query CustomerAccount { customer { id firstName lastName displayName emailAddress { emailAddress } phoneNumber { phoneNumber } defaultAddress { id address1 address2 city zoneCode country zip phoneNumber } addresses(first: 20) { nodes { id address1 address2 city zoneCode country zip phoneNumber } } orders(first: 50, sortKey: PROCESSED_AT, reverse: true) { nodes { id name processedAt financialStatus fulfillmentStatus totalPrice { amount currencyCode } } } } }`;

export const Route = createFileRoute("/api/customer/me")({ server: { handlers: { GET: async ({ request }) => {
  const current = await getCustomerSession(request);
  if (!current) return Response.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const data = await customerGraphql(current.session, CUSTOMER_QUERY);
  const headers = new Headers({ "Cache-Control": "no-store" });
  if (current.refreshed) headers.append("Set-Cookie", sessionCookie(current.session));
  return Response.json({ authenticated: true, ...data }, { headers });
} } } });
