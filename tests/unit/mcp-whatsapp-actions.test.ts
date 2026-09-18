import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { handleWhatsappMcp } from "../../src/lib/mcp/whatsapp-handler.server";
import { exchangeCode, issueCode } from "../../src/lib/mcp/whatsapp-oauth.server";

const TEST_SECRET = "whatsapp-mcp-actions-test-secret-1234567890";
const CALLBACK = "https://chatgpt.com/connector/oauth/test";
const CLIENT_ID = "test-client";

function token() {
  process.env.WHAPI_WEBHOOK_SECRET = TEST_SECRET;
  const verifier = "v".repeat(43);
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const code = issueCode({
    sub: "verified-admin",
    clientId: CLIENT_ID,
    redirectUri: CALLBACK,
    challenge,
  });
  return exchangeCode(code, CLIENT_ID, CALLBACK, verifier);
}

function request(body: Record<string, unknown>, accessToken: string) {
  return new Request("https://indexes-store.vercel.app/api/mcp/whatsapp", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "MCP-Protocol-Version": "2025-06-18",
    },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  delete process.env.WHAPI_WEBHOOK_SECRET;
});

describe("Private WhatsApp MCP discovery", () => {
  it("returns a materialized initialize response", async () => {
    const response = await handleWhatsappMcp(
      request(
        {
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-06-18",
            capabilities: {},
            clientInfo: { name: "test", version: "1.0.0" },
          },
        },
        token(),
      ),
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      result?: { capabilities?: { tools?: unknown } };
    };
    expect(json.result?.capabilities?.tools).toBeDefined();
  });

  it("advertises all five read-only WhatsApp tools", async () => {
    const response = await handleWhatsappMcp(
      request({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, token()),
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      result?: { tools?: Array<{ name?: string; title?: string; annotations?: { readOnlyHint?: boolean } }> };
    };
    const tools = json.result?.tools ?? [];
    expect(tools.map((tool) => tool.name)).toEqual([
      "whapi_list_chats",
      "whapi_list_groups",
      "whapi_list_channels",
      "whapi_get_products",
      "whapi_get_messages",
    ]);
    expect(tools.every((tool) => Boolean(tool.title))).toBe(true);
    expect(tools.every((tool) => tool.annotations?.readOnlyHint === true)).toBe(true);
  });
});
