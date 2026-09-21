import { describe, it } from "vitest";
import assert from "node:assert/strict";
import {
  buildWhapiReadPath,
  parseWhapiReadInput,
  readBoundedJson,
  readWhapi,
  verifyWhapiWebhook,
  WhapiError,
} from "../../src/lib/whapi.server";
import { requireWhapiAdmin } from "../../src/lib/whapi-auth.server";
import type { WhapiAuthClient } from "../../src/lib/whapi-auth.server";
import { handleWhapiRead, handleWhapiWebhook } from "../../src/lib/whapi-http.server";

const testSecret = "local-test-secret-not-for-deployment-123456";
const input = (query: string) =>
  parseWhapiReadInput(new URL(`https://example.test/api/whapi/read?${query}`));
const adminRequest = () =>
  new Request("https://example.test/api/whapi/read?resource=chats", {
    headers: { authorization: "Bearer test.jwt.signature" },
  });
const healthy = () => ({
  channel_id: "HAWKEY-KFHM7",
  status: { code: 4, text: "AUTH" },
  user: { id: "967771370740" },
  ip: "private",
  device_id: "private",
});
const hasCode = (code: string) => (error: unknown) =>
  error instanceof WhapiError && error.code === code;

function authClient(role: unknown = true, roleError: unknown = null): WhapiAuthClient {
  return {
    auth: { getUser: async () => ({ data: { user: { id: "verified-admin" } }, error: null }) },
    rpc: async (name, args) => {
      assert.equal(name, "has_role");
      assert.deepEqual(args, { _user_id: "verified-admin", _role: "admin" });
      return { data: role, error: roleError };
    },
  };
}

function upstream(responses: unknown[]) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    const next = responses.shift();
    return next instanceof Response ? next : Response.json(next);
  };
  return { fetcher, calls };
}

describe("Whapi read-only request boundary", () => {
  for (const [resource, path] of [
    ["health", "/health"],
    ["chats", "/chats?count=20&offset=0"],
    ["groups", "/groups?count=20&offset=0"],
    ["channels", "/newsletters?count=20&offset=0"],
    ["products", "/business/products?count=20&offset=0"],
  ]) {
    it(`builds the fixed ${resource} path`, () =>
      assert.equal(buildWhapiReadPath(input(`resource=${resource}`)), path));
  }
  it("requires the complete chat ID returned by Whapi", () => {
    assert.equal(
      buildWhapiReadPath(input("resource=messages&chatId=123%40g.us&count=1&offset=2")),
      "/messages/list/123%40g.us?count=1&offset=2",
    );
  });
  for (const query of [
    "resource=send",
    "resource=https://evil.test",
    "resource=chats&path=/logout",
    "resource=chats&resource=groups",
    "resource=messages&chatId=../settings",
    "resource=messages",
    "resource=chats&chatId=123%40g.us",
    "resource=chats&count=51",
    "resource=chats&count=0",
    "resource=chats&offset=-1",
    "resource=chats&count=Infinity",
    "resource=chats&offset=10001",
  ]) {
    it(`rejects invalid input: ${query}`, () => assert.throws(() => input(query), WhapiError));
  }
  it("revalidates input before creating an upstream request", () => {
    assert.throws(
      () =>
        buildWhapiReadPath({ resource: "messages", chatId: "../../logout", count: 1, offset: 0 }),
      WhapiError,
    );
  });
});

describe("Whapi authentication and response privacy", () => {
  it("rejects requests without a session before creating a DB client", async () => {
    await assert.rejects(
      requireWhapiAdmin(new Request("https://example.test"), async () => {
        throw new Error("must not run");
      }),
      hasCode("UNAUTHORIZED"),
    );
  });
  it("rejects a Whapi API key used in place of the admin session", async () => {
    await assert.rejects(
      requireWhapiAdmin(
        new Request("https://example.test", {
          headers: { authorization: "Bearer provider-api-key" },
        }),
      ),
      hasCode("UNAUTHORIZED"),
    );
  });
  it("permits only a verified platform administrator", async () => {
    assert.equal(
      await requireWhapiAdmin(adminRequest(), async () => authClient()),
      "verified-admin",
    );
  });
  it("denies customers and tenant-only admins", async () => {
    await assert.rejects(
      requireWhapiAdmin(adminRequest(), async () => authClient(false)),
      hasCode("FORBIDDEN"),
    );
  });
  it("does not fail open when role lookup fails", async () => {
    await assert.rejects(
      requireWhapiAdmin(adminRequest(), async () => authClient(true, new Error("DB unavailable"))),
      hasCode("AUTHORIZATION_UNAVAILABLE"),
    );
  });
  it("rejects invalid user sessions without reading roles", async () => {
    const client = authClient();
    client.auth.getUser = async () => ({ data: { user: null }, error: new Error("expired") });
    await assert.rejects(
      requireWhapiAdmin(adminRequest(), async () => client),
      hasCode("UNAUTHORIZED"),
    );
  });
  it("performs authorization before accessing the provider", async () => {
    let reads = 0;
    const response = await handleWhapiRead(adminRequest(), undefined, {
      authorize: async () => {
        throw new WhapiError("FORBIDDEN", 403);
      },
      read: async () => {
        reads++;
      },
    });
    assert.equal(response.status, 403);
    assert.equal(reads, 0);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
  });
  it("redacts unexpected exception details", async () => {
    const response = await handleWhapiRead(adminRequest(), undefined, {
      authorize: async () => "admin",
      read: async () => {
        throw new Error("secret-provider-token");
      },
    });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { ok: false, code: "WHAPI_REQUEST_FAILED" });
  });
  it("does not expose a POST send proxy", async () => {
    const response = await handleWhapiRead(new Request("https://example.test", { method: "POST" }));
    assert.equal(response.status, 405);
  });
  it("returns authorized read data with no-store headers", async () => {
    const response = await handleWhapiRead(adminRequest(), undefined, {
      authorize: async () => "admin",
      read: async () => ({ chats: [] }),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("vary"), "Authorization");
    assert.deepEqual(await response.json(), { ok: true, resource: "chats", data: { chats: [] } });
  });
});

describe("Whapi upstream guardrails", () => {
  it("returns sanitized health without IP, device details or token", async () => {
    const mock = upstream([healthy()]);
    const result = await readWhapi(input("resource=health"), {
      token: "test-token",
      fetcher: mock.fetcher,
    });
    assert.deepEqual(result, {
      provider: "whapi",
      channelId: "HAWKEY-KFHM7",
      authorized: true,
      phone: "967771370740",
    });
    assert.equal(mock.calls[0].init?.method, "GET");
    assert.equal(mock.calls[0].init?.redirect, "error");
    assert.equal(mock.calls[0].init?.cache, "no-store");
    assert.ok(mock.calls[0].init?.signal);
  });
  it("fails closed if the deployment token belongs to another channel", async () => {
    const mock = upstream([{ ...healthy(), channel_id: "OTHER-CHANNEL" }]);
    await assert.rejects(
      readWhapi(input("resource=chats"), { token: "test", fetcher: mock.fetcher }),
      hasCode("WHAPI_CHANNEL_MISMATCH"),
    );
    assert.equal(mock.calls.length, 1);
  });
  it("fails closed if the configured channel has a different phone", async () => {
    const mock = upstream([{ ...healthy(), user: { id: "967000000000" } }]);
    await assert.rejects(
      readWhapi(input("resource=chats"), { token: "test", fetcher: mock.fetcher }),
      hasCode("WHAPI_PHONE_MISMATCH"),
    );
  });
  it("does not read messages from a disconnected session", async () => {
    const mock = upstream([{ ...healthy(), status: { code: 0, text: "STOPPED" } }]);
    await assert.rejects(
      readWhapi(input("resource=chats"), { token: "test", fetcher: mock.fetcher }),
      hasCode("WHAPI_NOT_AUTHORIZED"),
    );
    assert.equal(mock.calls.length, 1);
  });
  it("reads only after checking channel identity", async () => {
    const mock = upstream([healthy(), { chats: [] }]);
    assert.deepEqual(
      await readWhapi(input("resource=chats&count=1"), { token: "test", fetcher: mock.fetcher }),
      { chats: [] },
    );
    assert.equal(mock.calls[1].url, "https://gate.whapi.cloud/chats?count=1&offset=0");
    assert.ok(mock.calls.every((call) => call.init?.method === "GET"));
  });
  it("falls back to the global message query when a group-specific history page is empty", async () => {
    const groupId = "120363424962689313@g.us";
    const mock = upstream([
      healthy(),
      { messages: [] },
      { messages: [{ id: "group-message", chat_id: groupId }] },
    ]);
    assert.deepEqual(
      await readWhapi(input(`resource=messages&chatId=${encodeURIComponent(groupId)}&count=20`), {
        token: "test",
        fetcher: mock.fetcher,
      }),
      { messages: [{ id: "group-message" }] },
    );
    assert.equal(
      mock.calls[1].url,
      `https://gate.whapi.cloud/messages/list/${encodeURIComponent(groupId)}?count=20&offset=0`,
    );
    assert.equal(
      mock.calls[2].url,
      `https://gate.whapi.cloud/messages/list?chat_id=${encodeURIComponent(groupId)}&count=20&offset=0`,
    );
  });

  it("rejects an empty token before network access", async () => {
    const mock = upstream([]);
    await assert.rejects(
      readWhapi(input("resource=health"), { token: "", fetcher: mock.fetcher }),
      hasCode("WHAPI_NOT_CONFIGURED"),
    );
    assert.equal(mock.calls.length, 0);
  });
  it("does not reflect provider error bodies", async () => {
    const mock = upstream([new Response("private provider details", { status: 403 })]);
    await assert.rejects(
      readWhapi(input("resource=health"), { token: "test", fetcher: mock.fetcher }),
      hasCode("WHAPI_UPSTREAM_ERROR"),
    );
  });
  it("surfaces rate limiting without automatic repeated requests", async () => {
    const mock = upstream([new Response("too many", { status: 429 })]);
    await assert.rejects(
      readWhapi(input("resource=health"), { token: "test", fetcher: mock.fetcher }),
      hasCode("WHAPI_RATE_LIMITED"),
    );
    assert.equal(mock.calls.length, 1);
  });
  it("rejects oversized JSON including streamed bodies without Content-Length", async () => {
    await assert.rejects(
      readBoundedJson(new Response(JSON.stringify({ body: "x".repeat(100) })), 16),
      hasCode("PAYLOAD_TOO_LARGE"),
    );
  });
  it("rejects oversized declared lengths", async () => {
    await assert.rejects(
      readBoundedJson(new Response("{}", { headers: { "content-length": "9999" } }), 32),
      hasCode("PAYLOAD_TOO_LARGE"),
    );
  });
  it("rejects non-JSON responses", async () => {
    await assert.rejects(readBoundedJson(new Response("<html>")), hasCode("INVALID_JSON"));
  });
});

describe("Whapi webhook staging", () => {
  for (const header of ["x-whapi-secret", "x-webhook-secret", "authorization"]) {
    it(`accepts the configured ${header} transport`, () => {
      assert.equal(
        verifyWhapiWebhook(
          new Request("https://example.test", {
            headers: { [header]: header === "authorization" ? `Bearer ${testSecret}` : testSecret },
          }),
          testSecret,
        ),
        true,
      );
    });
  }
  it("rejects missing, incorrect, too-short and query-string secrets", () => {
    assert.equal(verifyWhapiWebhook(new Request("https://example.test"), testSecret), false);
    assert.equal(
      verifyWhapiWebhook(new Request(`https://example.test?secret=${testSecret}`), testSecret),
      false,
    );
    assert.equal(
      verifyWhapiWebhook(
        new Request("https://example.test", { headers: { "x-whapi-secret": "wrong" } }),
        testSecret,
      ),
      false,
    );
    assert.equal(
      verifyWhapiWebhook(
        new Request("https://example.test", { headers: { "x-whapi-secret": "short" } }),
        "short",
      ),
      false,
    );
  });
  it("rejects malformed authenticated message events without acknowledging them", async () => {
    const previous = process.env.WHAPI_WEBHOOK_SECRET;
    process.env.WHAPI_WEBHOOK_SECRET = testSecret;
    try {
      const response = await handleWhapiWebhook(
        new Request("https://example.test/api/webhooks/whapi", {
          method: "POST",
          headers: { "content-type": "application/json", "x-whapi-secret": testSecret },
          body: JSON.stringify({ messages: [{ id: "test" }] }),
        }),
      );
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { ok: false, code: "INVALID_EVENT" });
    } finally {
      if (previous === undefined) delete process.env.WHAPI_WEBHOOK_SECRET;
      else process.env.WHAPI_WEBHOOK_SECRET = previous;
    }
  });
});
