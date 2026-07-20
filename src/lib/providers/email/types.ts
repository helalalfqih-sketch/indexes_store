export type EmailSendResult =
  | { kind: "sent"; provider: string; messageId: string }
  | { kind: "skipped"; reason: string }
  | { kind: "error"; error: string };

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export interface EmailProvider {
  readonly name: string;
  readonly enabled: boolean;
  send(payload: EmailPayload): Promise<EmailSendResult>;
}
