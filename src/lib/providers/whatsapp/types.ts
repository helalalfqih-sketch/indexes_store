import type { OrderDTO } from "@/lib/domain/order";

export type WhatsAppSendResult =
  | { kind: "link"; url: string }
  | { kind: "sent"; provider: string; messageId: string }
  | { kind: "error"; error: string };

export interface WhatsAppProvider {
  readonly name: string;
  /** True if the provider can push messages server-side. False = link-only fallback. */
  readonly canSend: boolean;

  buildOrderMessage(order: OrderDTO): string;
  buildQuickOrderMessage(productName: string, price: string): string;

  /** Generate a wa.me link (always available regardless of provider). */
  buildLink(phone: string, message: string): string;

  /**
   * Actually push a message via provider API. Providers that only support links
   * should return `{ kind: "link", url }` instead of throwing.
   */
  send(phone: string, message: string): Promise<WhatsAppSendResult>;
}
