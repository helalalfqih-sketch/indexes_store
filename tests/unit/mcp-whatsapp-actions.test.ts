import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { handleWhatsappMcp } from "../../src/lib/mcp/whatsapp-handler.server";
import { exchangeCode, issueCode } from "../../src/lib/mcp/whatsapp-oauth.server";
import { INDEXES_STORES_GROUP_ID } from "../../src/lib/whapi.server";

const TEST_SECRET = "whatsapp-mcp-actions-test-secret-1234567890";
const CALLBACK = "https://chatgpt.com/connector/oauth/test";
const CLIENT_ID = "test-client";
const READ_TOOLS = [
  "whapi_list_chats",
  "whapi_list_groups",
  "whapi_list_channels",
  "whapi_get_products",
  "whapi_get_messages",
];
const WRITE_TOOLS = ["whapi_send_store_text", "whapi_forward_store_message"];

type LiteralSchema = { const?: unknown; enum?: unknown[] };
type DiscoveredTool = {
  name: string;
  title?: string;
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean };
  _meta?: { securitySchemes?: Array<{ type: string; scopes: string[] }> };
  inputSchema?: {
    additionalProperties?: boolean;
    required?: string[];
    properties?: Record<string, LiteralSchema>;
  };
};

function literalValue(schema?: LiteralSchema) {
  return schema?.const ?? (schema?.enum?.length === 1 ? schema.enum[0] : undefined);
}

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
      Accept: "application/json, text/event-stream",
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

  it("advertises exactly five read tools and two existing destination-limited write tools", async () => {
    const response = await handleWhatsappMcp(
      request({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, token()),
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as { result?: { tools?: DiscoveredTool[] } };
    const tools = json.result?.tools ?? [];
    expect(tools.map((tool) => tool.name)).toEqual([...READ_TOOLS, ...WRITE_TOOLS]);
    expect(tools.every((tool) => Boolean(tool.title))).toBe(true);

    for (const tool of tools) {
      const write = WRITE_TOOLS.includes(tool.name);
      expect(tool.annotations?.readOnlyHint).toBe(!write);
      expect(tool.annotations?.destructiveHint).toBe(false);
      expect(tool.annotations?.idempotentHint).toBe(!write);
      expect(tool._meta?.securitySchemes).toEqual([
        { type: "oauth2", scopes: [write ? "whatsapp.write" : "whatsapp.read"] },
      ]);
      if (write) {
        expect(tool.inputSchema?.additionalProperties).toBe(false);
        expect(tool.inputSchema?.required).toContain("to");
        expect(tool.inputSchema?.required).toContain("confirmed");
        expect(literalValue(tool.inputSchema?.properties?.to)).toBe(INDEXES_STORES_GROUP_ID);
        expect(literalValue(tool.inputSchema?.properties?.confirmed)).toBe(true);
      }
    }
  });
});
