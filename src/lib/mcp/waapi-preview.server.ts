/**
 * Read-only WaAPI vendor integration for an isolated Indexes WhatsApp MCP preview.
 *
 * WaAPI's API reference lists the instances collection and webhook subscriptions.
 * Only the POST subscription URL is specified verbatim in the supplied excerpt;
 * the GET instance/list routes must be checked against the full endpoint pages.
 * Never silently fall back to Whapi, another instance, or the production account.
 */
export type WaapiPreviewEnv = NodeJS.ProcessEnv;

const EXACT_INSTANCE = "106235";
const MAX_BYTES = 64 * 1024;
const BASE = "https://waapi.app/api/v1";
const ENABLED_FLAG = "INDEXES_WA_WAAPI_PREVIEW_ENABLED";

export const WAAPI_WEBHOOK_EVENT_NAMES = [
  "message", "loading_screen", "qr", "authenticated", "auth_failure",
  "ready", "disconnected", "message_create", "message_edit",
  "message_revoke_everyone", "message_revoke_me", "message_ack",
  "message_reaction", "media_uploaded", "group_join", "group_leave",
  "group_update", "community_created", "community_updated",
  "community_subgroup_linked", "community_subgroup_unlinked",
  "community_deactivated", "change_state", "call", "call_ended",
  "vote_update", "presence_update",
] as const;

const SELECTED_EVENTS = [
  "message", "message_create", "message_edit", "message_ack",
  "media_uploaded", "group_join", "group_leave", "group_update",
  "ready", "disconnected",
] as const;

export function isWaapiPreviewEnabled(env: WaapiPreviewEnv = process.env): boolean {
  return env.VERCEL_ENV === "preview" && env[ENABLED_FLAG] === "true";
}

export function assertWaapiPreview(env: WaapiPreviewEnv = process.env) {
  if (!isWaapiPreviewEnabled(env) || env.INDEXES_WA_META_PREVIEW_ENABLED === "true") {
    throw new Error("WAAPI_PREVIEW_DISABLED_OR_CONFLICTING");
  }
}

export function getWaapiPreviewConfig(env: WaapiPreviewEnv = process.env) {
  assertWaapiPreview(env);
  const instanceId = env.INDEXES_WA_WAAPI_PREVIEW_INSTANCE_ID?.trim();
  const accessToken = env.INDEXES_WA_WAAPI_PREVIEW_API_TOKEN?.trim();
  if (instanceId !== EXACT_INSTANCE) throw new Error("WAAPI_PREVIEW_INSTANCE_NOT_APPROVED");
  if (!accessToken || accessToken.length < 12 || accessToken.length > 4096) {
    throw new Error("WAAPI_PREVIEW_READ_CREDENTIAL_NOT_CONFIGURED");
  }
  return { instanceId, accessToken };
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function field(value: unknown, max = 180): string | null {
  return typeof value === "string" ? value.slice(0, max) : null;
}

async function readWaapi(
  resource: "instance" | "subscriptions",
  env: WaapiPreviewEnv,
  transport: typeof fetch = fetch,
): Promise<Record<string, unknown>> {
  const config = getWaapiPreviewConfig(env);
  // GET route shape is inferred from the documented "retrieve instance GET"
  // and "list webhook subscriptions GET" operations. Verify their exact URLs
  // against the respective WaAPI endpoint pages before live preview setup.
  const path = resource === "instance"
    ? "/instances/" + config.instanceId
    : "/instances/" + config.instanceId + "/webhooks";
  let response: Response;
  try {
    response = await transport(BASE + path, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + config.accessToken,
        Accept: "application/json",
      },
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new Error("WAAPI_PREVIEW_READ_UNAVAILABLE");
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error("WAAPI_PREVIEW_HTTP_" + response.status);
  }
  const size = Number(response.headers.get("content-length") || 0);
  if (size > MAX_BYTES) {
    await response.body?.cancel();
    throw new Error("WAAPI_PREVIEW_RESPONSE_TOO_LARGE");
  }
  // Bounded streaming prevents unexpectedly large group/chat objects being
  // materialized as responses to our small metadata reads.
  const reader = response.body?.getReader();
  if (!reader) throw new Error("WAAPI_PREVIEW_EMPTY_RESPONSE");
  const parts: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BYTES) throw new Error("WAAPI_PREVIEW_RESPONSE_TOO_LARGE");
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const merged = new Uint8Array(bytes);
  let at = 0;
  for (const part of parts) { merged.set(part, at); at += part.byteLength; }
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(merged));
  } catch {
    throw new Error("WAAPI_PREVIEW_INVALID_JSON");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("WAAPI_PREVIEW_INVALID_PROVIDER_RESPONSE");
  }
  return body as Record<string, unknown>;
}

export async function readWaapiPreviewInstance(
  env: WaapiPreviewEnv = process.env,
  transport?: typeof fetch,
) {
  const config = getWaapiPreviewConfig(env);
  const raw = await readWaapi("instance", env, transport);
  const root = object(raw.data);
  const instance = Object.keys(object(root.instance)).length
    ? object(root.instance)
    : Object.keys(root).length ? root : raw;
  if (String(instance.id) !== config.instanceId) {
    throw new Error("WAAPI_PREVIEW_INSTANCE_RESPONSE_MISMATCH");
  }
  const connected = object(instance.connectedAccount ?? instance.connected_account);
  return {
    provider: "waapi.app",
    instanceId: config.instanceId,
    name: field(instance.name),
    status: field(instance.status),
    connectedAccount: field(connected.name ?? instance.connected_account_name),
    apiReachable: true,
    groupChannelOperationsVerified: false,
    actualMessagesVerified: false,
  };
}

export async function readWaapiPreviewSubscriptions(
  env: WaapiPreviewEnv = process.env,
  transport?: typeof fetch,
) {
  getWaapiPreviewConfig(env);
  const raw = await readWaapi("subscriptions", env, transport);
  const base = raw.data;
  const nested = object(base);
  const subscriptions = Array.isArray(base) ? base
    : Array.isArray(nested.subscriptions) ? nested.subscriptions
    : Array.isArray(nested.webhooks) ? nested.webhooks
    : null;
  if (!subscriptions) throw new Error("WAAPI_PREVIEW_UNRECOGNIZED_SUBSCRIPTION_SCHEMA");
  if (subscriptions.length > 25) throw new Error("WAAPI_PREVIEW_SUBSCRIPTION_LIMIT_INCONSISTENT");
  return {
    provider: "waapi.app",
    instanceId: EXACT_INSTANCE,
    totalReturned: subscriptions.length,
    subscriptions: subscriptions.map((value) => {
      const s = object(value);
      const events = Array.isArray(s.events) ? s.events : [];
      const host = (() => {
        try { return new URL(String(s.url)).hostname; } catch { return null; }
      })();
      return {
        id: typeof s.id === "number" ? s.id : null,
        active: typeof s.isActive === "boolean" ? s.isActive : null,
        source: field(s.source, 40),
        eventTypes: events.flatMap((item) => {
          const event = typeof item === "string" ? item : object(item).type;
          return typeof event === "string" &&
            (WAAPI_WEBHOOK_EVENT_NAMES as readonly string[]).includes(event)
            ? [event] : [];
        }),
        targetHost: host, // Do not disclose secret URLs or private webhook paths.
      };
    }),
  };
}

export function waapiPreviewCapabilities(env: WaapiPreviewEnv = process.env) {
  return {
    provider: "waapi.app",
    previewEnabled: isWaapiPreviewEnabled(env),
    instanceId: EXACT_INSTANCE,
    documentedInUserProvidedWaapiReference: {
      directMessages: true,
      historySearch: true,
      mediaSendAndDownload: true,
      groupManagement: true,
      channelSearchAndSubscriptions: true,
      communities: "beta",
      instanceWebhooks: true,
    },
    operationallyTestedWithThisInstance: false,
    inPreviewAdapter: {
      instanceMetadataRead: "prepared_requires_credential_and_endpoint_verification",
      webhookSubscriptionList: "prepared_requires_credential_and_endpoint_verification",
      subscriptionPlan: "available_offline",
      webhookEventIngestion: "blocked_until_callback_auth_is_verified",
      messageSending: "not_enabled",
      groupsAndChannels: "documentation_only_not_enabled",
    },
    platformNote: "WaAPI is a third-party service, not Meta's official WhatsApp Cloud API.",
  };
}

export function waapiPreviewWebhookRegistrationPlan(
  env: WaapiPreviewEnv = process.env,
) {
  assertWaapiPreview(env);
  const configId = env.INDEXES_WA_WAAPI_PREVIEW_INSTANCE_ID?.trim();
  if (configId !== EXACT_INSTANCE) throw new Error("WAAPI_PREVIEW_INSTANCE_NOT_APPROVED");
  const host = env.VERCEL_URL?.trim() || "";
  if (!/^[a-z0-9][a-z0-9.-]*\.vercel\.app$/i.test(host) || host.includes("/")) {
    throw new Error("WAAPI_PREVIEW_HOST_NOT_CONFIGURED");
  }
  return {
    method: "POST",
    documentedApiPath: BASE + "/instances/" + EXACT_INSTANCE + "/webhooks",
    proposedCallback: "https://" + host + "/api/webhooks/waapi-preview",
    body: { events: [...SELECTED_EVENTS], source: "api" },
    subscriptionLimit: 25,
    documentationStatesDuplicateUrlReturns: 200,
    registrationExecuted: false,
    callbackAuthenticationVerified: false,
    reasonNotRegistered:
      "X-Hook-Secret is documented as stored and echoed in the subscription response; " +
      "the supplied text does not establish webhook request authenticity. No callback subscription is safe yet.",
  };
}

export function disabledWaapiPreviewCallback(
  env: WaapiPreviewEnv = process.env,
): Response {
  if (!isWaapiPreviewEnabled(env)) {
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  return Response.json(
    { error: "CALLBACK_VERIFICATION_NOT_IMPLEMENTED", accepted: false },
    {
      status: 503,
      headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    },
  );
}
