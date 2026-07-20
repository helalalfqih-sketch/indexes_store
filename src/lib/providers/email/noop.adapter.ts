import type { EmailProvider, EmailSendResult } from "./types";

/** TODO: wire to Lovable Email once a sender domain is provisioned. */
export const noopEmailAdapter: EmailProvider = {
  name: "noop",
  enabled: false,
  async send(): Promise<EmailSendResult> {
    return { kind: "skipped", reason: "Email provider not configured" };
  },
};
