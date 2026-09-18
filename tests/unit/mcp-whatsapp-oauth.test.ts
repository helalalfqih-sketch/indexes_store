import { describe, expect, it } from "vitest";
import {
  CHATGPT_CALLBACK,
  CHATGPT_CLIENT_ID,
  validateClient,
} from "../../src/lib/mcp/whatsapp-oauth.server";

describe("ChatGPT static OAuth client", () => {
  it("accepts the exact ChatGPT connector callback", () => {
    expect(() => validateClient(CHATGPT_CLIENT_ID, CHATGPT_CALLBACK)).not.toThrow();
  });

  it("rejects callback substitution for the static client", () => {
    expect(() =>
      validateClient(CHATGPT_CLIENT_ID, "https://chatgpt.com/connector/oauth/attacker"),
    ).toThrow();
  });

  it("rejects another host for the static client", () => {
    expect(() =>
      validateClient(CHATGPT_CLIENT_ID, "https://example.com/connector/oauth/P1JNErjTS0-9"),
    ).toThrow();
  });
});
