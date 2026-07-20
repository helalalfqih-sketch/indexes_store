import type { WhatsAppProvider } from "./types";
import { waMeAdapter } from "./wa-me.adapter";
import { whatsappBusinessAdapter } from "./business-api.adapter";

export type { WhatsAppProvider, WhatsAppSendResult } from "./types";
export { waMeAdapter, whatsappBusinessAdapter };

/**
 * Resolve the active WhatsApp provider. Prefers Business API when configured,
 * otherwise falls back to the always-available wa.me link builder.
 * DI-ready: services accept a WhatsAppProvider param and default to this.
 */
export function resolveWhatsAppProvider(): WhatsAppProvider {
  if (whatsappBusinessAdapter.canSend) return whatsappBusinessAdapter;
  return waMeAdapter;
}
