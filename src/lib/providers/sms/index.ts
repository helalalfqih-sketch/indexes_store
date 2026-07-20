import type { SmsProvider } from "./types";
import { noopSmsAdapter } from "./noop.adapter";

export type { SmsProvider, SmsSendResult } from "./types";

export function resolveSmsProvider(): SmsProvider {
  return noopSmsAdapter;
}
