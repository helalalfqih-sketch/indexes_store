import type { EmailProvider } from "./types";
import { noopEmailAdapter } from "./noop.adapter";

export type { EmailProvider, EmailPayload, EmailSendResult } from "./types";

export function resolveEmailProvider(): EmailProvider {
  return noopEmailAdapter;
}
