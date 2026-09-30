import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  requireSupabaseAuth,
  type SupabaseAuthContext,
} from "@/integrations/supabase/auth-middleware";
import { checkTenantPermission } from "@/lib/users.functions";
import { resolveTenantId } from "@/lib/saas/tenant-context";

const WHAPI_BASE_URL = "https://gate.whapi.cloud";
const MAX_QR_BYTES = 2 * 1024 * 1024;
const DEFAULT_CHANNEL_ID = "HAWKEY-KFHM7";
const DEFAULT_PHONE = "967771370740";

interface WhapiAccountConfig {
  id: string;
  label: string;
  phone: string;
  tokenEnv?: string;
  token?: string;
}

export interface WhapiAccount {
  id: string;
  displayName: string;
  phone: string;
  state: string;
  isConnected: boolean;
  isLoggedIn: boolean;
  metadataSynced?: boolean;
}

export interface WhapiRuntimeMetadataRow {
  tenant_id: string;
  provider: "whapi";
  channel_id: string;
  phone: string;
  display_name: string;
  connection_state: string;
  authorized: boolean;
  last_seen_at: string | null;
  metadata: {
    runtime: "whapi";
    control_plane: "vercel";
  };
  updated_at: string;
}

const accountIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[A-Za-z0-9._-]+$/);
const tokenEnvSchema = z
  .string()
  .trim()
  .regex(/^WHAPI_TOKEN(?:_[A-Z0-9_]+)?$/);

export function parseWhapiAccountsConfig(
  raw: string | undefined,
  hasPrimaryToken: boolean,
): WhapiAccountConfig[] {
  if (raw?.trim()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("WHAPI_ACCOUNTS_JSON_INVALID");
    }
    return z
      .array(
        z.object({
          id: accountIdSchema,
          label: z.string().trim().min(1).max(120),
          phone: z
            .string()
            .trim()
            .regex(/^\d{8,20}$/),
          tokenEnv: tokenEnvSchema,
        }),
      )
      .min(1)
      .max(20)
      .parse(parsed);
  }
  if (!hasPrimaryToken) return [];
  return [
    {
      id: process.env.WHAPI_CHANNEL_ID?.trim() || DEFAULT_CHANNEL_ID,
      label: process.env.WHAPI_ACCOUNT_LABEL?.trim() || "اندكس للتجارة",
      phone: process.env.WHAPI_PHONE?.trim() || DEFAULT_PHONE,
      tokenEnv: "WHAPI_TOKEN",
    },
  ];
}

export function buildWhapiRuntimeMetadataRow(
  tenantId: string,
  account: WhapiAccount,
  now: string,
): WhapiRuntimeMetadataRow {
  return {
    tenant_id: tenantId,
    provider: "whapi",
    channel_id: account.id,
    phone: account.phone,
    display_name: account.displayName,
    connection_state: account.state,
    authorized: account.isLoggedIn,
    last_seen_at: account.isConnected ? now : null,
    metadata: {
      runtime: "whapi",
      control_plane: "vercel",
    },
    updated_at: now,
  };
}

function configuredAccounts(): WhapiAccountConfig[] {
  return parseWhapiAccountsConfig(
    process.env.WHAPI_ACCOUNTS_JSON,
    Boolean(process.env.WHAPI_TOKEN?.trim()),
  );
}

async function accountConfig(accountId: string): Promise<WhapiAccountConfig> {
  const id = accountIdSchema.parse(accountId);
  const configured = configuredAccounts().find((item) => item.id === id);
  if (configured) return configured;

  const { getWhapiPartnerChannel } = await import("@/lib/whapi-partner.server");
  const partner = await getWhapiPartnerChannel(id);
  if (partner) return partner;

  throw new Error("WHAPI_ACCOUNT_NOT_CONFIGURED");
}

function tokenFor(account: WhapiAccountConfig): string {
  if (account.token?.trim()) return account.token.trim();
  if (!account.tokenEnv) throw new Error("WHAPI_TOKEN_NOT_CONFIGURED");
  const token = process.env[account.tokenEnv]?.trim();
  if (!token) throw new Error(`WHAPI_TOKEN_NOT_CONFIGURED:${account.tokenEnv}`);
  return token;
}

async function requireIntegrationPermission(context: Partial<SupabaseAuthContext>) {
  const hasPerm = await checkTenantPermission("cms", context);
  if (!hasPerm) throw new Error("صلاحية مرفوضة: تتطلب صلاحية إدارة التكاملات.");
}

async function whapiFetch(account: WhapiAccountConfig, path: string, init: RequestInit = {}) {
  const response = await fetch(`${WHAPI_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${tokenFor(account)}`,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error(`WHAPI_${response.status}`);
  }
  return response;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function readHealth(account: WhapiAccountConfig): Promise<WhapiAccount> {
  const response = await whapiFetch(account, "/health?wakeup=true");
  const health = asRecord(await response.json());
  const status = asRecord(health.status);
  const user = asRecord(health.user);
  const providerChannelId = typeof health.channel_id === "string" ? health.channel_id : "";
  if (providerChannelId && providerChannelId !== account.id) {
    throw new Error("WHAPI_CHANNEL_MISMATCH");
  }
  const authorized = status.code === 4 && status.text === "AUTH";
  const providerPhone = authorized && user.id != null ? String(user.id) : "";
  if (authorized && providerPhone && providerPhone !== account.phone) {
    throw new Error("WHAPI_PHONE_MISMATCH");
  }
  return {
    id: account.id,
    displayName: account.label,
    phone: authorized ? providerPhone || account.phone : account.phone,
    state: typeof status.text === "string" ? status.text : "UNKNOWN",
    isConnected: authorized,
    isLoggedIn: authorized,
  };
}

async function syncRuntimeMetadata(
  context: SupabaseAuthContext,
  account: WhapiAccount,
): Promise<boolean> {
  try {
    const tenantId = await resolveTenantId(context.supabase, { userId: context.userId });
    if (!tenantId) return false;

    const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = buildWhapiRuntimeMetadataRow(tenantId, account, new Date().toISOString());
    const { error } = await getSupabaseAdmin()
      .from("whatsapp_runtime_accounts")
      .upsert(row, { onConflict: "tenant_id,provider,channel_id" });

    return !error;
  } catch {
    // The runtime must stay available even before the metadata migration is promoted.
    return false;
  }
}

export const listWhapiAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireIntegrationPermission(context);
    const { isWhapiPartnerConfigured, listWhapiPartnerChannels } =
      await import("@/lib/whapi-partner.server");

    const byId = new Map(configuredAccounts().map((account) => [account.id, account]));
    for (const account of await listWhapiPartnerChannels()) {
      if (!byId.has(account.id)) byId.set(account.id, account);
    }

    const accounts = await Promise.all(
      [...byId.values()].map(async (account) => {
        let status: WhapiAccount;
        try {
          status = await readHealth(account);
        } catch (error) {
          status = {
            id: account.id,
            displayName: account.label,
            phone: account.phone,
            state: error instanceof Error ? error.message : "UNAVAILABLE",
            isConnected: false,
            isLoggedIn: false,
          };
        }

        return {
          ...status,
          metadataSynced: await syncRuntimeMetadata(context, status),
        } satisfies WhapiAccount;
      }),
    );
    return {
      ok: true,
      provider: "whapi" as const,
      canCreateAccounts: isWhapiPartnerConfigured(),
      accounts,
    };
  });

export const createWhapiAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { label: string; phone?: string }) => data)
  .handler(async ({ data, context }) => {
    await requireIntegrationPermission(context);
    const label = z.string().trim().min(1).max(120).parse(data.label);
    const phone = data.phone?.trim()
      ? z
          .string()
          .trim()
          .regex(/^\\d{8,20}$/)
          .parse(data.phone.trim())
      : undefined;

    const { createWhapiPartnerChannel } = await import("@/lib/whapi-partner.server");
    const channel = await createWhapiPartnerChannel({ label, phone });
    const pending: WhapiAccount = {
      id: channel.id,
      displayName: label,
      phone: phone || channel.phone,
      state: "INITIALIZING",
      isConnected: false,
      isLoggedIn: false,
    };
    await syncRuntimeMetadata(context, pending);

    return { ok: true, account: pending };
  });

export const getWhapiAccountQr = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { accountId: string }) => data)
  .handler(async ({ data, context }) => {
    await requireIntegrationPermission(context);
    const account = await accountConfig(data.accountId);
    const response = await whapiFetch(account, "/users/login/image?size=320&width=320&height=320", {
      headers: { Accept: "image/png,image/jpeg,image/webp" },
    });
    const mime = (response.headers.get("content-type") || "image/png").split(";")[0].trim();
    if (!["image/png", "image/jpeg", "image/webp"].includes(mime)) {
      throw new Error("WHAPI_QR_INVALID_CONTENT_TYPE");
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_QR_BYTES) {
      throw new Error("WHAPI_QR_INVALID_SIZE");
    }
    return {
      ok: true,
      accountId: account.id,
      qrDataUrl: `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`,
    };
  });

export const reconnectWhapiAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { accountId: string }) => data)
  .handler(async ({ data, context }) => {
    await requireIntegrationPermission(context);
    const account = await accountConfig(data.accountId);
    const status = await readHealth(account);
    return {
      ok: true,
      status: {
        ...status,
        metadataSynced: await syncRuntimeMetadata(context, status),
      },
    };
  });

export const logoutWhapiAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { accountId: string; confirmed: true }) => data)
  .handler(async ({ data, context }) => {
    await requireIntegrationPermission(context);
    z.literal(true).parse(data.confirmed);
    const account = await accountConfig(data.accountId);
    await whapiFetch(account, "/users/logout", { method: "POST" });

    const loggedOut: WhapiAccount = {
      id: account.id,
      displayName: account.label,
      phone: account.phone,
      state: "LOGGED_OUT",
      isConnected: false,
      isLoggedIn: false,
    };
    await syncRuntimeMetadata(context, loggedOut);

    return { ok: true };
  });
