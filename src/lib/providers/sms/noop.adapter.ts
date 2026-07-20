import type { SmsProvider, SmsSendResult } from "./types";

/** TODO: replace with a real SMS provider (GatewayAPI / local YMN aggregator) when credentials are set. */
export const noopSmsAdapter: SmsProvider = {
  name: "noop",
  enabled: false,
  async send(_phone: string, _message: string): Promise<SmsSendResult> {
    return { kind: "skipped", reason: "SMS provider not configured" };
  },
};
