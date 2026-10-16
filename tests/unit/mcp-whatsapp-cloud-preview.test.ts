import { createHash, createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cloudPreviewCapabilities,
  cloudPreviewConfig,
  handleCloudPreviewWebhook,
  isCloudPreviewEnabled,
  parseCloudWebhookEvents,
  readCloudBusinessPhone,
  readCloudMediaMetadata,
  sendCloudPreviewTestText,
  verifyCloudWebhookSignature,
} from "../../src/lib/mcp/whatsapp-cloud-preview.server";

const TEST_SECRET = "test-only-meta-app-secret-not-for-production";
const config = {
  VERCEL_ENV: "preview",
  VERCEL_URL: "indexes-whatsapp-preview-abc.vercel.app",
  INDEXES_WA_META_PREVIEW_ENABLED: "true",
  INDEXES_WA_META_PREVIEW_WABA_ID: "1874598503444843",
  INDEXES_WA_META_PREVIEW_PHONE_ID: "919092231292165",
  INDEXES_WA_META_GRAPH_VERSION: "v25.0",
  INDEXES_WA_META_PREVIEW_ACCESS_TOKEN: "test-token-not-real",
  INDEXES_WA_META_PREVIEW_APP_SECRET: TEST_SECRET,
  INDEXES_WA_META_PREVIEW_VERIFY_TOKEN: "test-only-verify-token-123456789",
} as NodeJS.ProcessEnv;

const signed = (raw: string) =>
  "sha256=" + createHmac("sha256", TEST_SECRET).update(raw).digest("hex");

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("official Meta WhatsApp preview security boundary", () => {
  it("stays completely disabled without BOTH Vercel preview and the opt-in flag", () => {
    expect(isCloudPreviewEnabled({ ...config, VERCEL_ENV: "production" })).toBe(false);
    expect(isCloudPreviewEnabled({ ...config, INDEXES_WA_META_PREVIEW_ENABLED: "false" })).toBe(false);
    expect(cloudPreviewCapabilities({ ...config, VERCEL_ENV: "production" }).mode).toBe("disabled");
  });

  it("validates exact official account binding and Graph version", () => {
    expect(cloudPreviewConfig(config).phoneId).toBe("919092231292165");
    expect(() => cloudPreviewConfig({ ...config, INDEXES_WA_META_PREVIEW_PHONE_ID: "bad" })).toThrow();
    expect(() => cloudPreviewConfig({ ...config, INDEXES_WA_META_GRAPH_VERSION: "evil" })).toThrow();
    expect(() => cloudPreviewConfig({ ...config, VERCEL_ENV: "production" })).toThrow();
  });

  it("reads only the owned phone from WABA and does not equate listing with live message delivery", async () => {
    const transport = vi.fn().mockResolvedValue(Response.json({
      data: [
        { id: "other", display_phone_number: "+111" },
        {
          id: config.INDEXES_WA_META_PREVIEW_PHONE_ID,
          display_phone_number: "+967 771 370 740",
          code_verification_status: "NOT_VERIFIED",
          quality_rating: "GREEN",
        },
      ],
    }));
    const result = await readCloudBusinessPhone(config, transport);
    expect(result.displayPhone).toBe("+967 771 370 740");
    expect(result.actualMessageDeliveryVerified).toBe(false);
    expect(transport.mock.calls[0][0]).toContain("/1874598503444843/phone_numbers");
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it("does not return temporary media download URLs or accept arbitrary resource IDs", async () => {
    const transport = vi.fn().mockResolvedValue(Response.json({
      id: "123456789",
      mime_type: "image/jpeg",
      file_size: 241,
      url: "https://lookaside.fbsbx.com/private-signed-media",
    }));
    const result = await readCloudMediaMetadata("123456789", config, transport);
    expect(result.fileSize).toBe(241);
    expect(JSON.stringify(result)).not.toContain("lookaside");
    await expect(readCloudMediaMetadata("https://example.com", config, transport)).rejects.toThrow();
  });

  it("rejects webhook tampering and invalid signatures", () => {
    const raw = JSON.stringify({ object: "whatsapp_business_account", entry: [] });
    expect(verifyCloudWebhookSignature(raw, signed(raw), TEST_SECRET)).toBe(true);
    expect(verifyCloudWebhookSignature(raw + "x", signed(raw), TEST_SECRET)).toBe(false);
    expect(verifyCloudWebhookSignature(raw, "sha256=deadbeef", TEST_SECRET)).toBe(false);
    expect(verifyCloudWebhookSignature(raw, null, TEST_SECRET)).toBe(false);
  });

  it("requires exact WABA + phone and extracts only bounded first-party message fields", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [{
        id: config.INDEXES_WA_META_PREVIEW_WABA_ID,
        changes: [{
          field: "messages",
          value: {
            metadata: { phone_number_id: config.INDEXES_WA_META_PREVIEW_PHONE_ID },
            messages: [{ id: "wamid.123", from: "967771111111", type: "text", timestamp: "1790000000", text: { body: "Hello" }, arbitrary: "discard" }],
          },
        }],
      }],
    };
    const rows = parseCloudWebhookEvents(payload, config.INDEXES_WA_META_PREVIEW_WABA_ID!, config.INDEXES_WA_META_PREVIEW_PHONE_ID!);
    expect(rows).toHaveLength(1);
    expect(rows[0].payload.text).toBe("Hello");
    expect(JSON.stringify(rows)).not.toContain("arbitrary");
    expect(() => parseCloudWebhookEvents(payload, "000000", config.INDEXES_WA_META_PREVIEW_PHONE_ID!)).toThrow("META_PREVIEW_WABA_MISMATCH");
    expect(() => parseCloudWebhookEvents(payload, config.INDEXES_WA_META_PREVIEW_WABA_ID!, "000000")).toThrow("META_PREVIEW_PHONE_MISMATCH");
  });

  it("never acknowledges signed incoming messages when the staging database is not configured", async () => {
    const raw = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [{
        id: config.INDEXES_WA_META_PREVIEW_WABA_ID,
        changes: [{
          field: "messages",
          value: {
            metadata: { phone_number_id: config.INDEXES_WA_META_PREVIEW_PHONE_ID },
            messages: [{ id: "wamid.integration-test", from: "967771111111", type: "text", text: { body: "test" } }],
          },
        }],
      }],
    });
    const request = new Request("https://example.com/api/webhooks/whatsapp-cloud-preview", {
      method: "POST",
      headers: { "x-hub-signature-256": signed(raw) },
      body: raw,
    });
    const response = await handleCloudPreviewWebhook(request, config);
    expect(response.status).toBe(503);
  });

  it("keeps webhook endpoint absent from production and validates subscription verification", async () => {
    const href = "https://example.com/api/webhooks/whatsapp-cloud-preview?hub.mode=subscribe&hub.verify_token=" +
      config.INDEXES_WA_META_PREVIEW_VERIFY_TOKEN + "&hub.challenge=123456";
    expect((await handleCloudPreviewWebhook(new Request(href), { ...config, VERCEL_ENV: "production" })).status).toBe(404);
    const response = await handleCloudPreviewWebhook(new Request(href), config);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("123456");
  });

  it("refuses all writes by default and refuses non-allowlisted recipients", async () => {
    await expect(sendCloudPreviewTestText(
      { to: "967771111111", body: "test", confirmed: true },
      config,
    )).rejects.toThrow("META_PREVIEW_SEND_DISABLED");
    await expect(sendCloudPreviewTestText(
      { to: "967771111111", body: "test", confirmed: true },
      { ...config, INDEXES_WA_META_PREVIEW_SEND_ENABLED: "true", INDEXES_WA_META_PREVIEW_TEST_RECIPIENT: "967779999999" },
    )).rejects.toThrow("META_PREVIEW_RECIPIENT_NOT_ALLOWLISTED");
  });

  it("builds a separate preview OAuth issuer and no longer depends on the Whapi webhook secret", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "indexes-whatsapp-preview-abc.vercel.app");
    vi.stubEnv("INDEXES_WA_META_PREVIEW_ENABLED", "true");
    vi.stubEnv("INDEXES_WHATSAPP_MCP_OAUTH_SECRET", "independent-preview-oauth-secret-1234567890");
    vi.stubEnv("WHAPI_WEBHOOK_SECRET", "");
    const oauth = await import("../../src/lib/mcp/whatsapp-oauth.server");
    expect(oauth.ISSUER).toBe("https://indexes-whatsapp-preview-abc.vercel.app");
    const verifier = "v".repeat(43);
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const code = oauth.issueCode({
      sub: "verified-admin",
      clientId: "test-client",
      redirectUri: "https://chatgpt.com/connector/oauth/test",
      challenge,
    });
    const access = oauth.exchangeCode(code, "test-client", "https://chatgpt.com/connector/oauth/test", verifier);
    expect(oauth.verifyAccessToken(access)).toBe("verified-admin");
  });

  it("publishes Meta-only MCP preview tools without exposing legacy Whapi write tools", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "indexes-whatsapp-preview-abc.vercel.app");
    vi.stubEnv("INDEXES_WA_META_PREVIEW_ENABLED", "true");
    vi.stubEnv("INDEXES_WHATSAPP_MCP_OAUTH_SECRET", "independent-preview-oauth-secret-1234567890");
    vi.stubEnv("WHAPI_WEBHOOK_SECRET", "");
    const oauth = await import("../../src/lib/mcp/whatsapp-oauth.server");
    const { handleWhatsappMcp } = await import("../../src/lib/mcp/whatsapp-handler.server");
    const verifier = "v".repeat(43);
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const code = oauth.issueCode({
      sub: "verified-admin", clientId: "test-client",
      redirectUri: "https://chatgpt.com/connector/oauth/test", challenge,
    });
    const access = oauth.exchangeCode(code, "test-client", "https://chatgpt.com/connector/oauth/test", verifier);
    const response = await handleWhatsappMcp(new Request("https://indexes-whatsapp-preview-abc.vercel.app/api/mcp/whatsapp", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + access,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-06-18",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    }));
    expect(response.status).toBe(200);
    const data = await response.json() as { result?: { tools?: Array<{ name: string }> } };
    const names = (data.result?.tools || []).map(x => x.name);
    expect(names).toContain("meta_preview_capabilities");
    expect(names).toContain("meta_preview_recent_events");
    expect(names).toContain("meta_preview_send_test_text");
    expect(names).not.toContain("whapi_send_text");
    expect(names).not.toContain("whapi_list_groups");
  });
});
