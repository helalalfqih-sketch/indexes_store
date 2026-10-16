import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  disabledWaapiPreviewCallback,
  getWaapiPreviewConfig,
  isWaapiPreviewEnabled,
  readWaapiPreviewInstance,
  readWaapiPreviewSubscriptions,
  waapiPreviewCapabilities,
  waapiPreviewWebhookRegistrationPlan,
  WAAPI_WEBHOOK_EVENT_NAMES,
} from "../../src/lib/mcp/waapi-preview.server";

const PREVIEW = {
  VERCEL_ENV: "preview",
  VERCEL_URL: "indexes-waapi-qa.vercel.app",
  INDEXES_WA_WAAPI_PREVIEW_ENABLED: "true",
  INDEXES_WA_WAAPI_PREVIEW_INSTANCE_ID: "106235",
  INDEXES_WA_WAAPI_PREVIEW_API_TOKEN: "preview-read-token-placeholder",
} as NodeJS.ProcessEnv;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("WaAPI authorized preview is fail-closed and isolated", () => {
  it("requires preview AND exact feature flag", () => {
    expect(isWaapiPreviewEnabled(PREVIEW)).toBe(true);
    expect(isWaapiPreviewEnabled({ ...PREVIEW, VERCEL_ENV: "production" })).toBe(false);
    expect(isWaapiPreviewEnabled({ ...PREVIEW, INDEXES_WA_WAAPI_PREVIEW_ENABLED: "false" })).toBe(false);
    expect(() => getWaapiPreviewConfig({ ...PREVIEW, VERCEL_ENV: "production" })).toThrow();
    expect(() => getWaapiPreviewConfig({ ...PREVIEW, INDEXES_WA_META_PREVIEW_ENABLED: "true" })).toThrow();
  });

  it("rejects wrong instance ID or absent API Token", () => {
    expect(getWaapiPreviewConfig(PREVIEW).instanceId).toBe("106235");
    expect(() => getWaapiPreviewConfig({ ...PREVIEW, INDEXES_WA_WAAPI_PREVIEW_INSTANCE_ID: "106236" })).toThrow("WAAPI_PREVIEW_INSTANCE_NOT_APPROVED");
    expect(() => getWaapiPreviewConfig({ ...PREVIEW, INDEXES_WA_WAAPI_PREVIEW_API_TOKEN: "" })).toThrow("WAAPI_PREVIEW_READ_CREDENTIAL_NOT_CONFIGURED");
  });

  it("marks vendor-documented groups/channels as untested, never as Meta API parity", () => {
    const result = waapiPreviewCapabilities(PREVIEW);
    expect(result.documentedInUserProvidedWaapiReference.groupManagement).toBe(true);
    expect(result.operationallyTestedWithThisInstance).toBe(false);
    expect(result.inPreviewAdapter.groupsAndChannels).toBe("documentation_only_not_enabled");
  });

  it("uses read-only bearer GET, exact instance 106235 and redacts unknown metadata", async () => {
    const transport = vi.fn().mockResolvedValue(Response.json({
      data: { id: 106235, name: "Instance #106235", status: "Ready", connectedAccount: { name: "اندكس للتجارة" }, secret: "never returned" },
    }));
    const result = await readWaapiPreviewInstance(PREVIEW, transport);
    expect(result.instanceId).toBe("106235");
    expect(result.connectedAccount).toBe("اندكس للتجارة");
    expect(result.actualMessagesVerified).toBe(false);
    expect(JSON.stringify(result)).not.toContain("never returned");
    expect(transport.mock.calls[0][0]).toBe("https://waapi.app/api/v1/instances/106235");
    expect(transport.mock.calls[0][1].method).toBe("GET");
    expect(transport.mock.calls[0][1].redirect).toBe("error");
  });

  it("rejects a mismatching provider instance without displaying it", async () => {
    const transport = vi.fn().mockResolvedValue(Response.json({ data: { id: 106236, status: "Ready" } }));
    await expect(readWaapiPreviewInstance(PREVIEW, transport)).rejects.toThrow("WAAPI_PREVIEW_INSTANCE_RESPONSE_MISMATCH");
  });

  it("summarizes subscription events without exposing a secret webhook path", async () => {
    const transport = vi.fn().mockResolvedValue(Response.json({
      data: [{
        id: 42,
        url: "https://hooks.zapier.com/hooks/standard/123456/private-secret/",
        events: ["message", "group_update"],
        isActive: true,
        source: "zapier",
      }],
    }));
    const subscriptions = await readWaapiPreviewSubscriptions(PREVIEW, transport);
    expect(subscriptions.totalReturned).toBe(1);
    expect(subscriptions.subscriptions[0].targetHost).toBe("hooks.zapier.com");
    expect(subscriptions.subscriptions[0].eventTypes).toContain("group_update");
    expect(JSON.stringify(subscriptions)).not.toContain("private-secret");
    expect(transport.mock.calls[0][1].method).toBe("GET");
    expect(transport.mock.calls[0][0]).toBe("https://waapi.app/api/v1/instances/106235/webhooks");
  });

  it("creates a documented POST registration plan but performs no write", () => {
    expect(WAAPI_WEBHOOK_EVENT_NAMES).toHaveLength(27);
    const plan = waapiPreviewWebhookRegistrationPlan(PREVIEW);
    expect(plan.method).toBe("POST");
    expect(plan.documentedApiPath).toBe("https://waapi.app/api/v1/instances/106235/webhooks");
    expect(plan.subscriptionLimit).toBe(25);
    expect(plan.registrationExecuted).toBe(false);
    expect(plan.callbackAuthenticationVerified).toBe(false);
  });

  it("always rejects inbound callbacks until webhook authentication is verified", async () => {
    const closed = disabledWaapiPreviewCallback(PREVIEW);
    expect(closed.status).toBe(503);
    const production = disabledWaapiPreviewCallback({ ...PREVIEW, VERCEL_ENV: "production" });
    expect(production.status).toBe(404);
  });

  it("binds the existing MCP only to WaAPI tools in the isolated preview", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "indexes-waapi-qa.vercel.app");
    vi.stubEnv("INDEXES_WA_WAAPI_PREVIEW_ENABLED", "true");
    vi.stubEnv("INDEXES_WA_META_PREVIEW_ENABLED", "false");
    vi.stubEnv("INDEXES_WHATSAPP_MCP_OAUTH_SECRET", "isolated-qa-signing-secret-12345678901234");
    vi.stubEnv("WHAPI_WEBHOOK_SECRET", "");
    const oauth = await import("../../src/lib/mcp/whatsapp-oauth.server");
    const { handleWhatsappMcp } = await import("../../src/lib/mcp/whatsapp-handler.server");
    expect(oauth.ISSUER).toBe("https://indexes-waapi-qa.vercel.app");
    const verifier = "v".repeat(43);
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const code = oauth.issueCode({
      sub: "verified-admin", clientId: "test-client",
      redirectUri: "https://chatgpt.com/connector/oauth/test", challenge,
    });
    const access = oauth.exchangeCode(code, "test-client", "https://chatgpt.com/connector/oauth/test", verifier);
    const request = new Request("https://indexes-waapi-qa.vercel.app/api/mcp/whatsapp", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + access,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-06-18",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    });
    const result = await handleWhatsappMcp(request);
    expect(result.status).toBe(200);
    const json = await result.json() as { result?: { tools?: Array<{ name: string }> } };
    const names = (json.result?.tools || []).map(t => t.name);
    expect(names).toContain("waapi_preview_instance");
    expect(names).toContain("waapi_preview_webhooks");
    expect(names).toContain("waapi_preview_webhook_plan");
    expect(names).not.toContain("whapi_list_groups");
    expect(names).not.toContain("whapi_send_text");
    expect(names).not.toContain("meta_preview_send_test_text");
  });
});
