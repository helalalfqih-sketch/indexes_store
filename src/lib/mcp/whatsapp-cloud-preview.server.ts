import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Isolated Meta Cloud API adapter for Indexes WhatsApp MCP.
 *
 * This code is inaccessible on production deployments, even if a token is set.
 * No Whapi session, cookie, or unofficial WhatsApp interface is used.
 */
const MAX_WEBHOOK_BYTES = 64 * 1024;
const FORMER_PRODUCTION_REF = "wtudcippyxbaobqzbmok";
const PHONE_ID = /^[1-9][0-9]{5,29}$/;
const GRAPH_VERSION = /^v[1-9][0-9]?\.[0-9]{1,2}$/;
const MAX_EVENTS = 100;

export type PreviewEnvironment = NodeJS.ProcessEnv;

export function isCloudPreviewEnabled(env: PreviewEnvironment = process.env): boolean {
  return env.VERCEL_ENV === "preview" && env.INDEXES_WA_META_PREVIEW_ENABLED === "true";
}

function requirePreview(env: PreviewEnvironment) {
  if (!isCloudPreviewEnabled(env)) throw new Error("META_PREVIEW_DISABLED");
}

function textSetting(env: PreviewEnvironment, key: string, limit = 250): string {
  const value = env[key]?.trim() || "";
  if (!value || value.length > limit) throw new Error("META_PREVIEW_NOT_CONFIGURED");
  return value;
}

export function cloudPreviewConfig(env: PreviewEnvironment = process.env) {
  requirePreview(env);
  const wabaId = textSetting(env, "INDEXES_WA_META_PREVIEW_WABA_ID");
  const phoneId = textSetting(env, "INDEXES_WA_META_PREVIEW_PHONE_ID");
  const version = textSetting(env, "INDEXES_WA_META_GRAPH_VERSION", 8);
  const accessToken = textSetting(env, "INDEXES_WA_META_PREVIEW_ACCESS_TOKEN", 2048);
  if (!PHONE_ID.test(wabaId) || !PHONE_ID.test(phoneId) || !GRAPH_VERSION.test(version)) {
    throw new Error("META_PREVIEW_INVALID_CONFIGURATION");
  }
  return { wabaId, phoneId, version, accessToken };
}

export function cloudPreviewCapabilities(env: PreviewEnvironment = process.env) {
  return {
    provider: "meta_whatsapp_business_platform",
    mode: isCloudPreviewEnabled(env) ? "preview_only" : "disabled",
    liveMessagesSent: false,
    liveMessagesReceivedVerified: false,
    features: {
      businessPhoneAndStatus: "implemented_preview_read",
      newDirectMessages: "implemented_signed_staging_webhook_requires_setup",
      newMessageHistory: "implemented_staging_storage_requires_setup",
      mediaMetadata: "implemented_preview_read",
      mediaBinary: "not_implemented",
      testTextSending: "implemented_but_disabled_by_default",
      customerTemplates: "not_implemented",
      deliveryStatuses: "implemented_signed_staging_webhook_requires_setup",
      existingPersonalGroupHistory: "not_verified_or_available_in_this_adapter",
      groupAdministration: "not_verified_or_available_in_this_adapter",
      channelPublishingAndAdministration: "not_verified_or_available_in_this_adapter",
    },
  };
}

async function metaJson(
  pathname: string,
  options: RequestInit | undefined,
  env: PreviewEnvironment,
  transport: typeof fetch = fetch,
): Promise<Record<string, unknown>> {
  const config = cloudPreviewConfig(env);
  if (!/^\/[0-9][0-9/]*$/.test(pathname)) {
    throw new Error("META_PREVIEW_UNSAFE_RESOURCE");
  }
  const url = "https://graph.facebook.com/" + config.version + pathname;
  const headers: Record<string, string> = {
    Authorization: "Bearer " + config.accessToken,
    Accept: "application/json",
  };
  if (options?.body) headers["Content-Type"] = "application/json";
  let response: Response;
  try {
    response = await transport(url, {
      ...options,
      headers,
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error("META_PREVIEW_UPSTREAM_UNREACHABLE");
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error("META_PREVIEW_UPSTREAM_" + response.status);
  }
  const length = Number(response.headers.get("content-length") || 0);
  if (length > 64 * 1024) {
    await response.body?.cancel();
    throw new Error("META_PREVIEW_RESPONSE_TOO_LARGE");
  }
  const raw = await response.text();
  if (raw.length > 64 * 1024) throw new Error("META_PREVIEW_RESPONSE_TOO_LARGE");
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new Error("META_PREVIEW_INVALID_PROVIDER_RESPONSE");
  }
}

export async function readCloudBusinessPhone(
  env: PreviewEnvironment = process.env,
  transport?: typeof fetch,
) {
  const config = cloudPreviewConfig(env);
  const result = await metaJson("/" + config.wabaId + "/phone_numbers", undefined, env, transport);
  const phones = Array.isArray(result.data) ? result.data : [];
  const exact = phones.find((x) => x && typeof x === "object" && String(x.id) === config.phoneId);
  if (!exact) throw new Error("META_PREVIEW_PHONE_NOT_IN_WABA");
  const phone = exact as Record<string, unknown>;
  return {
    provider: "meta_whatsapp_business_platform",
    phoneId: config.phoneId,
    displayPhone: typeof phone.display_phone_number === "string" ? phone.display_phone_number : null,
    verifiedName: typeof phone.verified_name === "string" ? phone.verified_name : null,
    codeVerificationStatus:
      typeof phone.code_verification_status === "string" ? phone.code_verification_status : null,
    qualityRating: typeof phone.quality_rating === "string" ? phone.quality_rating : null,
    actualMessageDeliveryVerified: false,
  };
}

export async function readCloudMediaMetadata(
  mediaId: string,
  env: PreviewEnvironment = process.env,
  transport?: typeof fetch,
) {
  if (!PHONE_ID.test(mediaId)) throw new Error("META_PREVIEW_INVALID_MEDIA_ID");
  const result = await metaJson("/" + mediaId, undefined, env, transport);
  if (String(result.id || "") !== mediaId) throw new Error("META_PREVIEW_MEDIA_MISMATCH");
  return {
    mediaId,
    mimeType: typeof result.mime_type === "string" ? result.mime_type : null,
    fileSize: typeof result.file_size === "number" ? result.file_size : null,
    sha256: typeof result.sha256 === "string" ? result.sha256 : null,
    // Never expose the short-lived authenticated media download URL to MCP clients.
  };
}

export async function sendCloudPreviewTestText(
  input: { to: string; body: string; confirmed: true },
  env: PreviewEnvironment = process.env,
  transport?: typeof fetch,
) {
  const config = cloudPreviewConfig(env);
  if (env.INDEXES_WA_META_PREVIEW_SEND_ENABLED !== "true") {
    throw new Error("META_PREVIEW_SEND_DISABLED");
  }
  if (input.confirmed !== true || !/^[1-9][0-9]{8,14}$/.test(input.to)) {
    throw new Error("META_PREVIEW_SEND_NOT_CONFIRMED");
  }
  const allowlisted = env.INDEXES_WA_META_PREVIEW_TEST_RECIPIENT?.trim();
  if (!allowlisted || input.to !== allowlisted) {
    throw new Error("META_PREVIEW_RECIPIENT_NOT_ALLOWLISTED");
  }
  if (!input.body.trim() || input.body.length > 4096) {
    throw new Error("META_PREVIEW_INVALID_BODY");
  }
  const result = await metaJson(
    "/" + config.phoneId + "/messages",
    {
      method: "POST",
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.to,
        type: "text",
        text: { body: input.body },
      }),
    },
    env,
    transport,
  );
  const message = Array.isArray(result.messages) ? result.messages[0] : undefined;
  if (!message || typeof message.id !== "string") {
    throw new Error("META_PREVIEW_SEND_UNCONFIRMED");
  }
  return {
    providerMessageId: message.id,
    recipient: input.to,
    status: "accepted_by_provider_not_confirmed_delivered",
  };
}

export function verifyCloudWebhookSignature(
  rawBody: string,
  header: string | null,
  appSecret: string | undefined,
): boolean {
  if (!appSecret || appSecret.length < 32 || !header || !/^sha256=[0-9a-f]{64}$/i.test(header)) {
    return false;
  }
  const actual = Buffer.from(header.slice(7), "hex");
  const expected = createHmac("sha256", appSecret).update(rawBody).digest();
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

type StagedEvent = {
  waba_id: string;
  phone_number_id: string;
  external_event_id: string;
  event_type: "message" | "status";
  payload: Record<string, unknown>;
};

function obj(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function short(value: unknown, maximum: number): string | null {
  return typeof value === "string" ? value.slice(0, maximum) : null;
}

export function parseCloudWebhookEvents(
  payload: unknown,
  wabaId: string,
  phoneId: string,
): StagedEvent[] {
  const body = obj(payload);
  if (body.object !== "whatsapp_business_account" || !Array.isArray(body.entry)) {
    throw new Error("META_PREVIEW_INVALID_WEBHOOK");
  }
  const events: StagedEvent[] = [];
  for (const incoming of body.entry) {
    const entry = obj(incoming);
    if (String(entry.id) !== wabaId) throw new Error("META_PREVIEW_WABA_MISMATCH");
    if (!Array.isArray(entry.changes)) continue;
    for (const changeRaw of entry.changes) {
      const change = obj(changeRaw);
      if (change.field !== "messages") continue;
      const value = obj(change.value);
      if (String(obj(value.metadata).phone_number_id) !== phoneId) {
        throw new Error("META_PREVIEW_PHONE_MISMATCH");
      }
      for (const m of Array.isArray(value.messages) ? value.messages : []) {
        const message = obj(m);
        const id = short(message.id, 200);
        if (!id) continue;
        const kind = short(message.type, 30) || "unknown";
        const media = obj(message[kind]);
        events.push({
          waba_id: wabaId,
          phone_number_id: phoneId,
          external_event_id: id,
          event_type: "message",
          payload: {
            from: short(message.from, 24),
            timestamp: short(message.timestamp, 30),
            type: kind,
            text: short(obj(message.text).body, 4096),
            mediaId: short(media.id, 200),
            mimeType: short(media.mime_type, 120),
            caption: short(media.caption, 1024),
          },
        });
      }
      for (const m of Array.isArray(value.statuses) ? value.statuses : []) {
        const status = obj(m);
        const id = short(status.id, 200);
        const state = short(status.status, 40);
        const stamp = short(status.timestamp, 30);
        if (!id || !state) continue;
        events.push({
          waba_id: wabaId,
          phone_number_id: phoneId,
          external_event_id: id + ":" + state + ":" + (stamp || ""),
          event_type: "status",
          payload: {
            messageId: id,
            status: state,
            recipient: short(status.recipient_id, 24),
            timestamp: stamp,
          },
        });
      }
      if (events.length > MAX_EVENTS) throw new Error("META_PREVIEW_TOO_MANY_EVENTS");
    }
  }
  return events;
}

function assertIsolatedPreviewDatabase(env: PreviewEnvironment) {
  requirePreview(env);
  const expectedRef = textSetting(env, "INDEXES_WA_META_PREVIEW_DB_REF", 50);
  const endpoint = textSetting(env, "SUPABASE_URL", 240);
  let host = "";
  try {
    const parsed = new URL(endpoint);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error();
    host = parsed.hostname;
  } catch {
    throw new Error("META_PREVIEW_DB_NOT_ISOLATED");
  }
  if (
    !/^[a-z0-9]{10,40}$/.test(expectedRef) ||
    expectedRef === FORMER_PRODUCTION_REF ||
    host !== expectedRef + ".supabase.co"
  ) {
    throw new Error("META_PREVIEW_DB_NOT_ISOLATED");
  }
}

export async function readCloudPreviewEvents(
  limit = 20,
  env: PreviewEnvironment = process.env,
) {
  const config = cloudPreviewConfig(env);
  assertIsolatedPreviewDatabase(env);
  const bounded = Math.min(Math.max(1, Math.trunc(limit)), 30);
  const { data, error } = await getSupabaseAdmin()
    .from("wa_meta_preview_events")
    .select("event_type,external_event_id,payload,received_at")
    .eq("waba_id", config.wabaId)
    .eq("phone_number_id", config.phoneId)
    .order("received_at", { ascending: false })
    .limit(bounded);
  if (error) throw new Error("META_PREVIEW_DATABASE_UNAVAILABLE");
  return { count: data?.length || 0, events: data || [] };
}

async function limitedBody(request: Request): Promise<string> {
  const headerLength = Number(request.headers.get("content-length") || 0);
  if (headerLength > MAX_WEBHOOK_BYTES) throw new Error("META_PREVIEW_PAYLOAD_TOO_LARGE");
  const reader = request.body?.getReader();
  if (!reader) return "";
  const parts: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_WEBHOOK_BYTES) throw new Error("META_PREVIEW_PAYLOAD_TOO_LARGE");
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

const responseHeaders = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function json(status: number, code: string) {
  return Response.json({ status: code }, { status, headers: responseHeaders });
}

export async function handleCloudPreviewWebhook(
  request: Request,
  env: PreviewEnvironment = process.env,
): Promise<Response> {
  if (!isCloudPreviewEnabled(env)) return json(404, "NOT_FOUND");
  if (request.method === "GET") {
    const params = new URL(request.url).searchParams;
    const token = params.get("hub.verify_token") || "";
    const expected = env.INDEXES_WA_META_PREVIEW_VERIFY_TOKEN || "";
    const actual = Buffer.from(token);
    const secret = Buffer.from(expected);
    if (
      params.get("hub.mode") !== "subscribe" ||
      expected.length < 24 ||
      actual.length !== secret.length ||
      !timingSafeEqual(actual, secret)
    ) return json(403, "FORBIDDEN");
    const challenge = params.get("hub.challenge") || "";
    if (!/^[0-9]{1,100}$/.test(challenge)) return json(400, "INVALID_CHALLENGE");
    return new Response(challenge, {
      status: 200,
      headers: { ...responseHeaders, "Content-Type": "text/plain" },
    });
  }
  if (request.method !== "POST") return json(405, "METHOD_NOT_ALLOWED");
  let raw = "";
  try {
    raw = await limitedBody(request);
  } catch {
    return json(413, "INVALID_OR_OVERSIZED_BODY");
  }
  if (!verifyCloudWebhookSignature(
    raw,
    request.headers.get("x-hub-signature-256"),
    env.INDEXES_WA_META_PREVIEW_APP_SECRET,
  )) return json(403, "INVALID_SIGNATURE");

  let events: StagedEvent[];
  try {
    const config = cloudPreviewConfig(env);
    events = parseCloudWebhookEvents(JSON.parse(raw), config.wabaId, config.phoneId);
  } catch {
    return json(422, "INVALID_EVENT");
  }
  if (!events.length) return json(200, "IGNORED");
  try {
    assertIsolatedPreviewDatabase(env);
    const { error } = await getSupabaseAdmin()
      .from("wa_meta_preview_events")
      .upsert(events, {
        onConflict: "waba_id,phone_number_id,external_event_id,event_type",
        ignoreDuplicates: true,
      });
    if (error) return json(503, "PERSISTENCE_UNAVAILABLE");
    return Response.json({ status: "stored", count: events.length }, {
      status: 200,
      headers: responseHeaders,
    });
  } catch {
    // Never ACK received customer data if it could not be persisted.
    return json(503, "STAGING_NOT_CONFIGURED");
  }
}
