/**
 * When the verified Shopify Draft Order bridge is activated, the legacy
 * public Supabase-only endpoint must never create an alternate local order.
 * The internal commit module is available only to trusted server handlers.
 */
export function assertLegacyCheckoutAllowed(draftOrderWritesEnabled: string | undefined): void {
  if (draftOrderWritesEnabled === "true") {
    throw new Error("SHOPIFY_DRAFT_ORDER_GATEWAY_REQUIRED");
  }
}
