import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import {
  forwardWhapiMessage,
  resolveWhapiDestination,
  resolveWhapiDestinationByName,
  readWhapi,
  sendWhapiText,
  sendWhapiTextByName,
} from "@/lib/whapi.server";
import { verifyAccessToken, AUDIENCE } from "./whatsapp-oauth.server";
import { registerFullWhapiTools } from "./whapi-full-tools.server";

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

async function server() {
  const instance = new McpServer(
    { name: "indexes-whatsapp", version: "1.2.0" },
    {
      instructions:
        "Private WhatsApp access for the Indexes Store administrator. Verify the exact destination before each approved write.",
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
    "whapi_resolve_destination",
    {
      title: "Resolve WhatsApp destination",
      description: "Verify an exact Chat ID with Whapi before writing.",
      inputSchema: z.object({ to: z.string().min(1).max(128) }).strict(),
      annotations,
      _meta: { securitySchemes },
    },
    async ({ to }) => {
      const data = await resolveWhapiDestination(to);
      return {
        structuredContent: { data },
        content: [{ type: "text" as const, text: JSON.stringify(data) }],
      };
    },
  );

  instance.registerTool(
    "whapi_resolve_destination_by_name",
    {
      title: "Resolve WhatsApp destination by exact name",
      description:
        "Resolve one exact WhatsApp chat/group/channel name to a unique Chat ID. Fails instead of guessing when zero or multiple exact matches exist.",
      inputSchema: z.object({ name: z.string().min(1).max(160) }).strict(),
      annotations,
      _meta: { securitySchemes },
    },
    async ({ name }) => {
      const data = await resolveWhapiDestinationByName(name);
      return {
        structuredContent: { data },
        content: [{ type: "text" as const, text: JSON.stringify(data) }],
      };
    },
  );

  instance.registerTool(
    "whapi_send_text_by_name",
    {
      title: "Send approved WhatsApp text by exact destination name",
      description:
        "Resolve one exact destination name, refuse ambiguous matches, then send one explicitly approved text message to the resolved Chat ID.",
      inputSchema: z
        .object({
          name: z.string().min(1).max(160),
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
    async ({ name, body }) => {
      const data = await sendWhapiTextByName({ name, body });
      return {
        structuredContent: { data },
        content: [{ type: "text" as const, text: JSON.stringify(data) }],
      };
    },
  );

  instance.registerTool(
    "whapi_send_text",
    {
      title: "Send approved WhatsApp text",
      description: "Send one approved text to an exact verified WhatsApp Chat ID.",
      inputSchema: z
        .object({
          to: z.string().min(1).max(128),
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
    "whapi_forward_message",
    {
      title: "Forward approved WhatsApp message",
      description: "Forward one approved existing WhatsApp message to an exact verified Chat ID.",
      inputSchema: z
        .object({
          messageId: z.string().min(1).max(512),
          to: z.string().min(1).max(128),
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

  instance.registerTool(
    "whapi_prepare_archive_sync",
    {
      title: "Prepare Whapi archive sync",
      description:
        "Safely enable full_history and callback_persist, preserve existing webhooks, attach the private webhook secret to the Indexes webhook, and run one webhook test. Does not reconnect WhatsApp automatically.",
      inputSchema: z.object({ confirmed: z.literal(true) }).strict(),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      _meta: { securitySchemes: writeSecuritySchemes },
    },
    async () => {
      const token = process.env.WHAPI_TOKEN?.trim();
      const secret = process.env.WHAPI_WEBHOOK_SECRET?.trim();
      if (!token) throw new Error("WHAPI_NOT_CONFIGURED");
      if (!secret || secret.length < 32) throw new Error("WHAPI_WEBHOOK_SECRET_NOT_CONFIGURED");

      const baseUrl = AUDIENCE.replace("/api/mcp/whatsapp", "");
      const targetUrl = `${baseUrl}/api/webhooks/whapi`;
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      const currentResponse = await fetch("https://gate.whapi.cloud/settings", {
        method: "GET",
        headers,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      });
      if (!currentResponse.ok) {
        await currentResponse.body?.cancel();
        throw new Error(`WHAPI_GET_SETTINGS_${currentResponse.status}`);
      }
      const current = (await currentResponse.json()) as Record<string, unknown>;
      const currentWebhooks = Array.isArray(current.webhooks) ? current.webhooks : [];

      let found = false;
      const webhooks = currentWebhooks.map((value) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) return value;
        const webhook = value as Record<string, unknown>;
        if (webhook.url !== targetUrl) return value;
        found = true;

        const existingHeaders =
          webhook.headers && typeof webhook.headers === "object" && !Array.isArray(webhook.headers)
            ? (webhook.headers as Record<string, string>)
            : {};
        const existingEvents = Array.isArray(webhook.events) ? webhook.events : [];
        const hasMessagesPost = existingEvents.some((event) => {
          if (!event || typeof event !== "object" || Array.isArray(event)) return false;
          const item = event as Record<string, unknown>;
          return item.type === "messages" && item.method === "post";
        });
        return {
          ...webhook,
          url: targetUrl,
          mode: "body",
          headers: { ...existingHeaders, "x-whapi-secret": secret },
          events: hasMessagesPost
            ? existingEvents
            : [...existingEvents, { type: "messages", method: "post" }],
        };
      });

      if (!found) {
        webhooks.push({
          url: targetUrl,
          mode: "body",
          headers: { "x-whapi-secret": secret },
          events: [{ type: "messages", method: "post" }],
        });
      }

      const patchResponse = await fetch("https://gate.whapi.cloud/settings", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          full_history: true,
          callback_persist: true,
          webhooks,
        }),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      });
      if (!patchResponse.ok) {
        await patchResponse.body?.cancel();
        throw new Error(`WHAPI_PATCH_SETTINGS_${patchResponse.status}`);
      }
      await patchResponse.body?.cancel();

      const testResponse = await fetch("https://gate.whapi.cloud/settings/webhook_test", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "messages",
          url: targetUrl,
          mode: "body",
          headers: { "x-whapi-secret": secret },
        }),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      });
      const webhookTestOk = testResponse.ok;
      if (testResponse.body) await testResponse.body.cancel();

      return {
        structuredContent: {
          data: {
            fullHistoryEnabled: true,
            callbackPersistEnabled: true,
            webhookConfigured: true,
            webhookTestOk,
            webhookUrl: targetUrl,
            reconnectRequired: true,
          },
        },
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              fullHistoryEnabled: true,
              callbackPersistEnabled: true,
              webhookConfigured: true,
              webhookTestOk,
              webhookUrl: targetUrl,
              reconnectRequired: true,
            }),
          },
        ],
      };
    },
  );

  instance.registerTool(
    "whapi_get_media_image",
    {
      title: "Whapi get media image",
      description:
        "CORE IMAGE TOOL. Fetch one original JPEG/PNG image from Whapi by Media ID and return it as MCP image content for visual inspection. Prefer this over generic media tools for images.",
      inputSchema: z.object({ mediaId: z.string().min(1).max(512) }).strict(),
      annotations,
      _meta: { securitySchemes },
    },
    async ({ mediaId }) => {
      const token = process.env.WHAPI_TOKEN;
      if (!token?.trim()) throw new Error("WHAPI_NOT_CONFIGURED");
      const response = await fetch(
        `https://gate.whapi.cloud/media/${encodeURIComponent(mediaId)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          redirect: "error",
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        },
      );
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(`WHAPI_MEDIA_${response.status}`);
      }
      const mime = (response.headers.get("content-type") || "").split(";")[0].trim();
      if (!["image/jpeg", "image/png"].includes(mime)) {
        await response.body?.cancel();
        throw new Error("WHAPI_MEDIA_NOT_IMAGE");
      }
      const length = Number(response.headers.get("content-length"));
      if (Number.isFinite(length) && length > 8 * 1024 * 1024) {
        await response.body?.cancel();
        throw new Error("WHAPI_MEDIA_TOO_LARGE");
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > 8 * 1024 * 1024) throw new Error("WHAPI_MEDIA_TOO_LARGE");
      const data = Buffer.from(bytes).toString("base64");
      return {
        structuredContent: { mediaId, mimeType: mime, size: bytes.byteLength },
        content: [
          { type: "image" as const, data, mimeType: mime },
          {
            type: "text" as const,
            text: JSON.stringify({ mediaId, mimeType: mime, size: bytes.byteLength }),
          },
        ],
      };
    },
  );

  await registerFullWhapiTools(instance, securitySchemes, writeSecuritySchemes);
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

  const instance = await server();
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
