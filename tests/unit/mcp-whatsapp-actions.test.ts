import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { handleWhatsappMcp } from "../../src/lib/mcp/whatsapp-handler.server";
import { exchangeCode, issueCode } from "../../src/lib/mcp/whatsapp-oauth.server";

const TEST_SECRET = "whatsapp-mcp-actions-test-secret-1234567890";
const CALLBACK = "https://chatgpt.com/connector/oauth/test";
const CLIENT_ID = "test-client";
const READ_TOOLS = [
  "whapi_list_chats",
  "whapi_list_groups",
  "whapi_list_channels",
  "whapi_get_products",
  "whapi_get_messages",
  "whapi_resolve_destination",
  "whapi_resolve_destination_by_name",
  "whapi_get_media_image",
];
const WRITE_TOOLS = [
  "whapi_send_text_by_name",
  "whapi_send_text",
  "whapi_forward_message",
  "whapi_prepare_archive_sync",
];

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

  it("preserves first-party tool security contracts while allowing the provider tool surface", async () => {
    const response = await handleWhatsappMcp(
      request({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, token()),
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as { result?: { tools?: DiscoveredTool[] } };
    const tools = json.result?.tools ?? [];
    const byName = new Map(tools.map((tool) => [tool.name, tool]));

    for (const name of READ_TOOLS) {
      const tool = byName.get(name);
      expect(tool, `missing read tool: ${name}`).toBeDefined();
      expect(Boolean(tool?.title)).toBe(true);
      expect(tool?.annotations?.readOnlyHint).toBe(true);
      expect(tool?.annotations?.destructiveHint).toBe(false);
      expect(tool?.annotations?.idempotentHint).toBe(true);
      expect(tool?._meta?.securitySchemes).toEqual([{ type: "oauth2", scopes: ["whatsapp.read"] }]);
    }

    for (const name of WRITE_TOOLS) {
      const tool = byName.get(name);
      expect(tool, `missing write tool: ${name}`).toBeDefined();
      expect(Boolean(tool?.title)).toBe(true);
      expect(tool?.annotations?.readOnlyHint).toBe(false);
      expect(tool?._meta?.securitySchemes).toEqual([
        { type: "oauth2", scopes: ["whatsapp.write"] },
      ]);
      expect(tool?.inputSchema?.additionalProperties).toBe(false);
      expect(tool?.inputSchema?.required).toContain("confirmed");
      expect(literalValue(tool?.inputSchema?.properties?.confirmed)).toBe(true);
    }

    for (const tool of tools) {
      expect(Boolean(tool.title), `missing title: ${tool.name}`).toBe(true);
      const scope = tool.annotations?.readOnlyHint === true ? "whatsapp.read" : "whatsapp.write";
      expect(tool._meta?.securitySchemes?.[0]?.type).toBe("oauth2");
      expect(tool._meta?.securitySchemes?.[0]?.scopes).toContain(scope);
      if (tool.annotations?.destructiveHint === true) {
        expect(literalValue(tool.inputSchema?.properties?.confirmed)).toBe(true);
      }
    }
  });
});
