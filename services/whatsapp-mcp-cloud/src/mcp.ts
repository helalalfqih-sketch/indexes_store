import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { config } from "./config.js";
import { verifyAccessToken } from "./oauth.js";
import { sessions } from "./session-manager.js";

const responseHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

function bearer(request: Request): string | null {
  const match = /^Bearer\s+(.+)$/i.exec(request.headers.get("authorization") ?? "");
  return match?.[1] ?? null;
}

async function createServer(sessionId: string) {
  await sessions.start(sessionId);
  const server = new McpServer(
    { name: "indexes-whatsapp-cloud", version: "0.1.0" },
    {
      instructions:
        "Private linked-device WhatsApp access. Do not bulk-message. Resolve and verify the exact destination before every approved write.",
    },
  );

  server.registerTool(
    "whatsapp_status",
    {
      description: "Get the current linked-device connection state for this OAuth-bound WhatsApp session.",
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async () => {
      const data = sessions.status(sessionId);
      return { structuredContent: { data }, content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  );

  server.registerTool(
    "whatsapp_list_chats",
    {
      description: "List recently observed chats for this WhatsApp session.",
      inputSchema: z.object({ limit: z.number().int().min(1).max(100).default(50) }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ limit }) => {
      const data = sessions.listChats(sessionId, limit);
      return { structuredContent: { data }, content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  );

  server.registerTool(
    "whatsapp_read_messages",
    {
      description: "Read recent messages already observed for one exact chat ID.",
      inputSchema: z
        .object({
          chatId: z.string().min(5).max(160),
          limit: z.number().int().min(1).max(100).default(50),
        })
        .strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ chatId, limit }) => {
      const data = sessions.readMessages(sessionId, chatId, limit);
      return { structuredContent: { data }, content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  );

  server.registerTool(
    "whatsapp_send_text",
    {
      description: "Send one explicitly approved text message to one exact WhatsApp chat ID.",
      inputSchema: z
        .object({
          chatId: z.string().min(5).max(160),
          text: z.string().min(1).max(4000),
          confirmed: z.literal(true),
        })
        .strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ chatId, text }) => {
      const data = await sessions.sendText(sessionId, chatId, text);
      return { structuredContent: { data }, content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  );

  return server;
}

export async function handleMcp(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...responseHeaders,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, MCP-Protocol-Version",
      },
    });
  }

  const token = bearer(request);
  if (!token) {
    return Response.json(
      { error: "unauthorized" },
      {
        status: 401,
        headers: {
          ...responseHeaders,
          "WWW-Authenticate": `Bearer resource_metadata="${config.origin}/.well-known/oauth-protected-resource/mcp"`,
        },
      },
    );
  }

  let sessionId: string;
  try {
    sessionId = verifyAccessToken(token).sid;
  } catch {
    return Response.json({ error: "invalid_token" }, { status: 401, headers: responseHeaders });
  }
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { ...responseHeaders, Allow: "POST, OPTIONS" } });
  }

  const server = await createServer(sessionId);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    const body = response.body ? await response.text() : null;
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(responseHeaders)) headers.set(key, value);
    return new Response(body, { status: response.status, headers });
  } finally {
    await server.close();
  }
}
