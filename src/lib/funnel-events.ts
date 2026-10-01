/** Funnel event payload helpers for marketing attribution. */

import { getStoredAttribution } from "./attribution";

export type FunnelEvent =
  | "WHATSAPP_CLICK"
  | "LEAD_CREATED"
  | "QUALIFIED"
  | "ORDER_CREATED"
  | "DELIVERED";

export function buildFunnelEvent(
  event: FunnelEvent,
  payload: Record<string, unknown> = {},
) {
  return {
    event,
    attribution: getStoredAttribution(),
    payload,
    createdAt: new Date().toISOString(),
  };
}
