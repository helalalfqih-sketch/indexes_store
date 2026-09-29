import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkTenantPermission } from "@/lib/users.functions";

const DEFAULT_GOWA_BASE_URL = "https://indexes-whatsapp-mcp.onrender.com";
const MAX_QR_BYTES = 2 * 1024 * 1024;

export interface GowaDevice {
  id: string;
  displayName: string;
  jid: string;
  state: string;
  createdAt?: string | null;
  isConnected?: boolean;
  isLoggedIn?: boolean;
}

function config() {
  const baseUrl = (process.env.GOWA_BASE_URL || DEFAULT_GOWA_BASE_URL).trim().replace(/\/+$/, "");
  const basicAuth = process.env.GOWA_BASIC_AUTH?.trim();
  if (!basicAuth) {
    throw new Error("GOWA_BASIC_AUTH_NOT_CONFIGURED");
  }

  const parsed = new URL(baseUrl);
  if (parsed.protocol !== "https:") {
    throw new Error("GOWA_BASE_URL_MUST_BE_HTTPS");
  }

  return {
    baseUrl,
    origin: parsed.origin,
    authorization: `Basic ${Buffer.from(basicAuth).toString("base64")}`,
  };
}

async function requireIntegrationPermission(context: unknown) {
  const ctx = context as any;
  const hasPerm = await checkTenantPermission("cms", ctx);
  if (!hasPerm) {
    throw new Error("صلاحية مرفوضة: تتطلب صلاحية إدارة التكاملات.");
  }
}

async function gowaFetch(path: string, init: RequestInit = {}) {
  const cfg = config();
  const response = await fetch(`${cfg.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: cfg.authorization,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    const text = (await response.text()).slice(0, 500);
    throw new Error(`GOWA_${response.status}: ${text || response.statusText}`);
  }

  return response;
}

function resultOf(payload: unknown): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return payload;
  const record = payload as Record<string, unknown>;
  return "results" in record ? record.results : payload;
}

export function parseGowaDevices(payload: unknown): GowaDevice[] {
  const raw = resultOf(payload);
  if (!Array.isArray(raw)) return [];

  const devices: GowaDevice[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id : "";
    if (!id) continue;
    devices.push({
      id,
      displayName: typeof row.display_name === "string" ? row.display_name : "",
      jid: typeof row.jid === "string" ? row.jid : "",
      state: typeof row.state === "string" ? row.state : "unknown",
      createdAt: typeof row.created_at === "string" ? row.created_at : null,
    });
  }
  return devices;
}

const deviceIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[A-Za-z0-9._-]+$/, "اسم الحساب يسمح فقط بالحروف والأرقام و . _ -");

export const listGowaAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireIntegrationPermission(context);
    const response = await gowaFetch("/devices");
    const payload = await response.json();
    const devices = parseGowaDevices(payload);

    const enriched = await Promise.all(
      devices.map(async (device) => {
        try {
          const statusResponse = await gowaFetch(
            `/devices/${encodeURIComponent(device.id)}/status`,
          );
          const statusPayload = resultOf(await statusResponse.json()) as Record<string, unknown>;
          return {
            ...device,
            isConnected: Boolean(statusPayload?.is_connected),
            isLoggedIn: Boolean(statusPayload?.is_logged_in),
          };
        } catch {
          return device;
        }
      }),
    );

    return {
      ok: true,
      serviceUrl: config().baseUrl,
      accounts: enriched,
    };
  });

export const createGowaAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { deviceId: string }) => data)
  .handler(async ({ data, context }) => {
    await requireIntegrationPermission(context);
    const deviceId = deviceIdSchema.parse(data.deviceId);
    const response = await gowaFetch("/devices", {
      method: "POST",
      body: JSON.stringify({ device_id: deviceId }),
    });
    return { ok: true, data: resultOf(await response.json()) };
  });

export const getGowaAccountStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { deviceId: string }) => data)
  .handler(async ({ data, context }) => {
    await requireIntegrationPermission(context);
    const deviceId = deviceIdSchema.parse(data.deviceId);
    const response = await gowaFetch(
      `/devices/${encodeURIComponent(deviceId)}/status`,
    );
    return { ok: true, data: resultOf(await response.json()) };
  });

export const getGowaAccountQr = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { deviceId: string }) => data)
  .handler(async ({ data, context }) => {
    await requireIntegrationPermission(context);
    const deviceId = deviceIdSchema.parse(data.deviceId);
    const loginResponse = await gowaFetch(
      `/devices/${encodeURIComponent(deviceId)}/login`,
    );
    const login = resultOf(await loginResponse.json()) as Record<string, unknown>;
    const qrLink = typeof login?.qr_link === "string" ? login.qr_link : "";
    if (!qrLink) throw new Error("GOWA_QR_LINK_MISSING");

    const cfg = config();
    const qrUrl = new URL(qrLink, cfg.baseUrl);
    if (qrUrl.origin !== cfg.origin) throw new Error("GOWA_QR_ORIGIN_MISMATCH");

    const imageResponse = await fetch(qrUrl, {
      headers: { Authorization: cfg.authorization, Accept: "image/*" },
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!imageResponse.ok) throw new Error(`GOWA_QR_${imageResponse.status}`);

    const mime = (imageResponse.headers.get("content-type") || "image/png")
      .split(";")[0]
      .trim();
    if (!["image/png", "image/jpeg", "image/webp"].includes(mime)) {
      throw new Error("GOWA_QR_INVALID_CONTENT_TYPE");
    }

    const bytes = new Uint8Array(await imageResponse.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_QR_BYTES) {
      throw new Error("GOWA_QR_INVALID_SIZE");
    }

    return {
      ok: true,
      deviceId,
      qrDataUrl: `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`,
      duration:
        typeof login?.qr_duration === "number" || typeof login?.qr_duration === "string"
          ? login.qr_duration
          : null,
    };
  });

export const reconnectGowaAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { deviceId: string }) => data)
  .handler(async ({ data, context }) => {
    await requireIntegrationPermission(context);
    const deviceId = deviceIdSchema.parse(data.deviceId);
    await gowaFetch(`/devices/${encodeURIComponent(deviceId)}/reconnect`, {
      method: "POST",
    });
    return { ok: true };
  });

export const logoutGowaAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { deviceId: string; confirmed: true }) => data)
  .handler(async ({ data, context }) => {
    await requireIntegrationPermission(context);
    z.literal(true).parse(data.confirmed);
    const deviceId = deviceIdSchema.parse(data.deviceId);
    await gowaFetch(`/devices/${encodeURIComponent(deviceId)}/logout`, {
      method: "POST",
    });
    return { ok: true };
  });

export const removeGowaAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { deviceId: string; confirmed: true }) => ({
    deviceId: deviceIdSchema.parse(data.deviceId),
    confirmed: z.literal(true).parse(data.confirmed),
  }))
  .handler(async ({ data, context }) => {
    await requireIntegrationPermission(context);
    z.literal(true).parse(data.confirmed);
    const deviceId = deviceIdSchema.parse(data.deviceId);
    await gowaFetch(`/devices/${encodeURIComponent(deviceId)}`, {
      method: "DELETE",
    });
    return { ok: true };
  });
