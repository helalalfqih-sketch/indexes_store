import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import {
  forwardWhapiMessage,
  INDEXES_STORES_GROUP_ID,
  readWhapi,
  sendWhapiText,
} from "@/lib/whapi.server";
import { verifyAccessToken, AUDIENCE } from "./whatsapp-oauth.server";

const META = `${AUDIENCE.replace(
  "/api/mcp/whatsapp",
  "",
)}/.well-known/oauth-protected-resource/api/mcp/whatsapp`;
const RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};
const securitySchemes = [{ type: "oauth2", scopes: ["whatsapp.read"] }];
const writeSecuritySchemes = [{ type: "oauth2", scopes: ["whatsapp.write"] }];

const titles = {
  chats: "List WhatsApp chats",
  groups: "List WhatsApp groups",
  channels: "List WhatsApp channels",
  products: "Read WhatsApp business products",
} as const;

function bearer(request: Request) {
  const match = /^Bearer (.+)$/.exec(request.headers.get("authorization") || "");
  if (!match) return null;
  try {
    return verifyAccessToken(match[1]);
  } catch {
    return null;
  }
}

function server() {
  const instance = new McpServer(
    { name: "indexes-whatsapp", version: "1.3.0" },
    {
      instructions:
        "Private WhatsApp access for the Indexes Store administrator. Reads are allowed; writes are limited to explicit allowlisted tools and destinations. Never delete, edit, broadcast, or mutate groups.",
    },
  );
  const add = (name: string, resource: "chats" | "groups" | "channels" | "products") =>
    instance.registerTool(
      name,
      {
        title: titles[resource],
        description: `Read one bounded page of WhatsApp ${resource}.`,
        inputSchema: z
          .object({
            count: z.number().int().min(1).max(50).default(20),
            offset: z.number().int().min(0).max(10000).default(0),
          })
          .strict(),
        annotations,
        _meta: { securitySchemes },
      },
      async ({ count, offset }) => {
        const data = await readWhapi({ resource, count, offset });
        return {
          structuredContent: { data },
          content: [{ type: "text" as const, text: JSON.stringify(data) }],
        };
      },
    );

  add("whapi_list_chats", "chats");
  add("whapi_list_groups", "groups");
  add("whapi_list_channels", "channels");
  add("whapi_get_products", "products");

  instance.registerTool(
    "whapi_get_messages",
    {
      title: "Read WhatsApp chat messages",
      description:
        "Read a bounded page of messages from an exact chat ID returned by whapi_list_chats.",
      inputSchema: z
        .object({
          chatId: z.string().min(1).max(128),
          count: z.number().int().min(1).max(50).default(20),
          offset: z.number().int().min(0).max(10000).default(0),
        })
        .strict(),
      annotations,
      _meta: { securitySchemes },
    },
    async ({ chatId, count, offset }) => {
      const data = await readWhapi({ resource: "messages", chatId, count, offset });
      return {
        structuredContent: { data },
        content: [{ type: "text" as const, text: JSON.stringify(data) }],
      };
    },
  );
  instance.registerTool(
    "whapi_send_store_text",
    {
      title: "Send approved text to Indexes stores group",
      description:
        "Send one explicitly approved text message only to the fixed Indexes stores WhatsApp group. Never use for previews or drafts.",
      inputSchema: z
        .object({
          to: z.literal(INDEXES_STORES_GROUP_ID),
          body: z.string().min(1).max(4000),
          confirmed: z.literal(true),
        })
        .strict(),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
      _meta: { securitySchemes: writeSecuritySchemes },
    },
    async ({ to, body }) => {
      const data = await sendWhapiText({ to, body });
      return {
        structuredContent: { data },
        content: [{ type: "text" as const, text: JSON.stringify(data) }],
      };
    },
  );


  instance.registerTool(
    "whapi_forward_store_message",
    {
      title: "Forward approved message to Indexes stores group",
      description:
        "Forward one explicitly approved existing WhatsApp message only to the fixed Indexes stores group.",
      inputSchema: z
        .object({
          messageId: z.string().min(1).max(512),
          to: z.literal(INDEXES_STORES_GROUP_ID),
          confirmed: z.literal(true),
        })
        .strict(),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
      _meta: { securitySchemes: writeSecuritySchemes },
    },
    async ({ messageId, to }) => {
      const data = await forwardWhapiMessage({ messageId, to });
      return {
        structuredContent: { data },
        content: [{ type: "text" as const, text: JSON.stringify(data) }],
      };
    },
  );

  return instance;
}

export async function handleWhatsappMcp(request: Request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...RESPONSE_HEADERS,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, MCP-Protocol-Version",
      },
    });
  }

  if (!bearer(request))
    return Response.json(
      { error: "unauthorized" },
      {
        status: 401,
        headers: {
          ...RESPONSE_HEADERS,
          "WWW-Authenticate": `Bearer resource_metadata="${META}"`,
        },
      },
    );

  if (request.method !== "POST")
    return new Response(null, {
      status: 405,
      headers: { ...RESPONSE_HEADERS, Allow: "POST, OPTIONS" },
    });

  const instance = server();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  try {
    await instance.connect(transport);
    const response = await transport.handleRequest(request);

    // The stateless server is closed after each request. Buffer the JSON response
    // first so tools/list and other MCP results are fully materialized before close.
    const body = response.body ? await response.text() : null;
    const headers = new Headers(response.headers);
    Object.entries(RESPONSE_HEADERS).forEach(([key, value]) => headers.set(key, value));
    return new Response(body, { status: response.status, headers });
  } finally {
    await instance.close();
  }
}
