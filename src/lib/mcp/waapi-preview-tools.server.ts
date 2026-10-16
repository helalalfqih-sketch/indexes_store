import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  readWaapiPreviewInstance,
  readWaapiPreviewSubscriptions,
  waapiPreviewCapabilities,
  waapiPreviewWebhookRegistrationPlan,
} from "./waapi-preview.server";

type Security = { type: string; scopes: string[] };
const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

function output(data: unknown) {
  return {
    structuredContent: { data },
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
  };
}

/**
 * Indexes WhatsApp MCP's WaAPI capability is preview-only and read-only.
 * No WaAPI send/group/channel/write operations are registered until account
 * permissions, provider callback authentication and exact endpoints are tested.
 */
export function registerWaapiPreviewTools(mcp: McpServer, readSecurity: Security[]) {
  mcp.registerTool(
    "waapi_preview_capabilities",
    {
      title: "Inspect WaAPI documented capabilities and implementation state",
      description: "Describe vendor-documented capabilities separately from verified account access.",
      inputSchema: z.object({}).strict(),
      annotations,
      _meta: { securitySchemes: readSecurity },
    },
    async () => output(waapiPreviewCapabilities()),
  );

  mcp.registerTool(
    "waapi_preview_instance",
    {
      title: "Read the approved WaAPI instance",
      description: "Read instance 106235 metadata using a preview-only API Token (read permission).",
      inputSchema: z.object({}).strict(),
      annotations,
      _meta: { securitySchemes: readSecurity },
    },
    async () => output(await readWaapiPreviewInstance()),
  );

  mcp.registerTool(
    "waapi_preview_webhooks",
    {
      title: "Inspect WaAPI webhook subscriptions",
      description: "List only sanitized webhook metadata for instance 106235; never return a webhook secret or URL path.",
      inputSchema: z.object({}).strict(),
      annotations,
      _meta: { securitySchemes: readSecurity },
    },
    async () => output(await readWaapiPreviewSubscriptions()),
  );

  mcp.registerTool(
    "waapi_preview_webhook_plan",
    {
      title: "Review WaAPI webhook registration (no changes)",
      description:
        "Show a dry-run plan for the vendor-documented POST subscriptions endpoint; never register a webhook.",
      inputSchema: z.object({}).strict(),
      annotations,
      _meta: { securitySchemes: readSecurity },
    },
    async () => output(waapiPreviewWebhookRegistrationPlan()),
  );
}
