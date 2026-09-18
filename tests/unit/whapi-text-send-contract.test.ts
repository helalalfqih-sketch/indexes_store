import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  INDEXES_STORES_GROUP_ID,
  sendWhapiText,
  WHAPI_CHANNEL_ID,
  WHAPI_PHONE,
  WhapiError,
} from "../../src/lib/whapi.server";

const input = { to: INDEXES_STORES_GROUP_ID, body: "اختبار محلي فقط" };
const token = "unit-test-only-no-provider-access";
const health = {
  channel_id: WHAPI_CHANNEL_ID,
  status: { code: 4, text: "AUTH" },
  user: { id: WHAPI_PHONE },
};
const message = { id: "test-receipt", chat_id: INDEXES_STORES_GROUP_ID, timestamp: 123 };
const accepted = { sent: true, message };
const codeIs = (code: string) => (error: unknown) =>
  error instanceof WhapiError && error.code === code;

function upstream(values: unknown[]) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetcher: typeof fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    assert.ok(values.length > 0, "Unexpected request/retry");
    const next = values.shift();
    if (next instanceof Error) throw next;
    return next instanceof Response ? next : Response.json(next);
  };
  return { calls, fetcher, token };
}

async function captureWarnings(run: (logs: unknown[][]) => Promise<void>) {
  const previous = console.warn;
  const logs: unknown[][] = [];
  console.warn = (...args: unknown[]) => logs.push(args);
  try {
    await run(logs);
  } finally {
    console.warn = previous;
  }
}

describe("Whapi text send request contract and safe diagnostics", () => {
  it("uses the documented string body and verifies the exact destination receipt", async () => {
    const mock = upstream([health, accepted, { messages: [message] }]);
    const result = await sendWhapiText(input, mock);
    assert.deepEqual(result, {
      sent: true,
      verified: true,
      messageId: message.id,
      chatId: input.to,
      timestamp: 123,
    });
    assert.deepEqual(
      mock.calls.map((call) => call.init.method),
      ["GET", "POST", "GET"],
    );
    assert.equal(new Headers(mock.calls[0].init.headers).has("Content-Type"), false);
    assert.equal(mock.calls[1].url, "https://gate.whapi.cloud/messages/text");
    assert.equal(new Headers(mock.calls[1].init.headers).get("Content-Type"), "application/json");
    assert.deepEqual(JSON.parse(String(mock.calls[1].init.body)), {
      ...input,
      typing_time: 0,
    });
    assert.equal(new Headers(mock.calls[2].init.headers).has("Content-Type"), false);
    assert.ok(mock.calls.every((call) => call.init.redirect === "error"));
  });

  it("reads nested numeric error.code without logging the token or message", async () => {
    await captureWarnings(async (logs) => {
      const mock = upstream([
        health,
        Response.json(
          {
            error: { code: 400, message: "body must be string", details: `${token} ${input.body}` },
          },
          { status: 400 },
        ),
      ]);
      await assert.rejects(sendWhapiText(input, mock), codeIs("WHAPI_UPSTREAM_400"));
      assert.equal(mock.calls.length, 2);
      assert.equal(logs.length, 1);
      const event = logs[0][1] as Record<string, unknown>;
      assert.equal(event.stage, "submit");
      assert.equal(event.endpoint, "/messages/text");
      assert.equal(event.method, "POST");
      assert.equal(event.providerStatus, 400);
      assert.equal(event.providerCode, 400);
      assert.deepEqual(event.providerFields, ["body"]);
      assert.deepEqual(event.reasonHints, ["string"]);
      assert.equal(JSON.stringify(logs).includes(token), false);
      assert.equal(JSON.stringify(logs).includes(input.body), false);
      assert.equal(JSON.stringify(logs).includes(input.to), false);
    });
  });

  it("does not mislabel a failed health request as a failed text submission", async () => {
    await captureWarnings(async (logs) => {
      const mock = upstream([Response.json({ error: { code: 0 } }, { status: 400 })]);
      await assert.rejects(sendWhapiText(input, mock), codeIs("WHAPI_HEALTH_400"));
      assert.equal(mock.calls.length, 1);
      const event = logs[0][1] as Record<string, unknown>;
      assert.equal(event.stage, "health");
      assert.equal(event.endpoint, "/health");
      assert.equal(event.method, "GET");
      assert.equal(event.providerCode, 0);
    });
  });

  it("preserves the HTTP failure for a non-JSON error and does not retry", async () => {
    await captureWarnings(async (logs) => {
      const mock = upstream([health, new Response("private gateway error", { status: 400 })]);
      await assert.rejects(sendWhapiText(input, mock), codeIs("WHAPI_UPSTREAM_400"));
      assert.equal(mock.calls.length, 2);
      const event = logs[0][1] as Record<string, unknown>;
      assert.equal(event.providerCode, null);
      assert.equal(event.responseFormat, "unreadable");
      assert.equal(JSON.stringify(logs).includes("private gateway error"), false);
    });
  });

  it("does not log free-form error strings as provider codes", async () => {
    await captureWarnings(async (logs) => {
      const mock = upstream([
        health,
        Response.json({ code: token, error: input.body }, { status: 400 }),
      ]);
      await assert.rejects(sendWhapiText(input, mock), codeIs("WHAPI_UPSTREAM_400"));
      assert.equal((logs[0][1] as Record<string, unknown>).providerCode, null);
      assert.equal(JSON.stringify(logs).includes(token), false);
      assert.equal(JSON.stringify(logs).includes(input.body), false);
    });
  });

  it("rejects non-string bodies before provider access", async () => {
    const mock = upstream([]);
    const invalid = { ...input, body: { text: "incorrect type" } } as unknown as typeof input;
    await assert.rejects(sendWhapiText(invalid, mock), codeIs("INVALID_MESSAGE_BODY"));
    assert.equal(mock.calls.length, 0);
  });

  it("keeps the destination and channel guardrails", async () => {
    const mock = upstream([]);
    await assert.rejects(
      sendWhapiText({ ...input, to: "other@g.us" }, mock),
      codeIs("WHAPI_DESTINATION_FORBIDDEN"),
    );
    assert.equal(mock.calls.length, 0);
    const wrongChannel = upstream([{ ...health, channel_id: "OTHER" }]);
    await assert.rejects(sendWhapiText(input, wrongChannel), codeIs("WHAPI_CHANNEL_MISMATCH"));
    assert.equal(wrongChannel.calls.length, 1);
  });

  it("does not report verified success for the same ID in a different chat", async () => {
    const mock = upstream([
      health,
      accepted,
      { messages: [{ ...message, chat_id: "other@g.us" }] },
    ]);
    await assert.rejects(sendWhapiText(input, mock), codeIs("WHAPI_SEND_UNVERIFIED"));
    assert.equal(mock.calls.filter((call) => call.init.method === "POST").length, 1);
  });

  it("does not attempt verification when the provider returns no message ID", async () => {
    const mock = upstream([health, { sent: true, message: { chat_id: input.to } }]);
    await assert.rejects(sendWhapiText(input, mock), codeIs("WHAPI_SEND_UNCONFIRMED"));
    assert.equal(mock.calls.length, 2);
  });

  it("treats a POST transport failure as unknown and never repeats the send", async () => {
    const mock = upstream([health, new Error("socket closed")]);
    await assert.rejects(sendWhapiText(input, mock), codeIs("WHAPI_SEND_UNKNOWN"));
    assert.equal(mock.calls.length, 2);
  });
});
