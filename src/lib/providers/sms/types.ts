export type SmsSendResult =
  | { kind: "sent"; provider: string; messageId: string }
  | { kind: "skipped"; reason: string }
  | { kind: "error"; error: string };

export interface SmsProvider {
  readonly name: string;
  readonly enabled: boolean;
  send(phone: string, message: string): Promise<SmsSendResult>;
}
