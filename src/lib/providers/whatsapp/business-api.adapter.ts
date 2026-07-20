import type { WhatsAppProvider, WhatsAppSendResult } from "./types";
import { waMeAdapter } from "./wa-me.adapter";

/**
 * WhatsApp Business Cloud API adapter.
 * TODO: enable when WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_ACCESS_TOKEN are configured.
 * Falls back transparently to wa.me links until then.
 */
export const whatsappBusinessAdapter: WhatsAppProvider = {
  name: "whatsapp-business",
  canSend: false, // flip to true once secrets are configured server-side

  buildOrderMessage: waMeAdapter.buildOrderMessage.bind(waMeAdapter),
  buildQuickOrderMessage: waMeAdapter.buildQuickOrderMessage.bind(waMeAdapter),
  buildLink: waMeAdapter.buildLink.bind(waMeAdapter),

  async send(phone: string, message: string): Promise<WhatsAppSendResult> {
    // TODO: implement Graph API call
    // const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    // const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    // if (!phoneNumberId || !accessToken) return waMeAdapter.send(phone, message);
    // await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, ...);
    return waMeAdapter.send(phone, message);
  },
};
