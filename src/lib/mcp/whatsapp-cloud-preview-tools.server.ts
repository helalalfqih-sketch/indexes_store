import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  cloudPreviewCapabilities,
  readCloudBusinessPhone,
  readCloudMediaMetadata,
  readCloudPreviewEvents,
  sendCloudPreviewTestText,
} from "./whatsapp-cloud-preview.server";

type OAuthSecurity = { type: string; scopes: string[] };
const readAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};
const writeAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
};

function result(data: unknown) {
  return {
    structuredContent: { data },
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
  };
}

/**
 * Registered only when the deployed Vercel environment is PREVIEW
 * and the dedicated cloud-preview feature flag is enabled.
 * The existing production Whapi MCP surface remains unchanged.
 */
export function registerCloudPreviewTools(
  mcp: McpServer,
  readSecurity: OAuthSecurity[],
  writeSecurity: OAuthSecurity[],
) {
  mcp.registerTool(
    "meta_preview_capabilities",
    {
      title: "Inspect official WhatsApp Cloud capabilities",
      description: "Reports implementation state, verified scope limitations, and staged-only features. No customer data or secrets.",
      inputSchema: z.object({}).strict(),
      annotations: readAnnotations,
      _meta: { securitySchemes: readSecurity },
    },
    async () => result(cloudPreviewCapabilities()),
  );

  mcp.registerTool(
    "meta_preview_business_phone",
    {
      title: "Read owned WhatsApp business phone",
      description: "Read the exact business phone assigned to the preview WABA via the official Meta Graph API.",
      inputSchema: z.object({}).strict(),
      annotations: readAnnotations,
      _meta: { securitySchemes: readSecurity },
    },
    async () => result(await readCloudBusinessPhone()),
  );

  mcp.registerTool(
    "meta_preview_media_metadata",
    {
      title: "Read official WhatsApp media metadata",
      description: "Read one approved media ID's MIME type, size, and checksum. Never expose temporary download URLs.",
      inputSchema: z.object({ mediaId: z.string().regex(/^[1-9][0-9]{5,29}$/) }).strict(),
      annotations: readAnnotations,
      _meta: { securitySchemes: readSecurity },
    },
    async ({ mediaId }) => result(await readCloudMediaMetadata(mediaId)),
  );

  mcp.registerTool(
    "meta_preview_recent_events",
    {
      title: "Read recent stored WhatsApp events in isolated staging",
      description: "Read up to 30 verified incoming messages/status events stored only in the configured staging Supabase instance.",
      inputSchema: z.object({ limit: z.number().int().min(1).max(30).default(20) }).strict(),
      annotations: readAnnotations,
      _meta: { securitySchemes: readSecurity },
    },
    async ({ limit }) => result(await readCloudPreviewEvents(limit)),
  );

  mcp.registerTool(
    "meta_preview_send_test_text",
    {
      title: "Send one explicitly approved TEST message",
      description:
        "Preview only; requires a separate send-enabled flag, confirmed=true and an exact test-recipient allowlist. Do not use on customers.",
      inputSchema: z.object({
        to: z.string().regex(/^[1-9][0-9]{8,14}$/),
        body: z.string().min(1).max(4096),
        confirmed: z.literal(true),
      }).strict(),
      annotations: writeAnnotations,
      _meta: { securitySchemes: writeSecurity },
    },
    async ({ to, body, confirmed }) => result(await sendCloudPreviewTestText({ to, body, confirmed })),
  );
}
