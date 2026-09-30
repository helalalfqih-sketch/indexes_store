import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  requireSupabaseAuth,
  type SupabaseAuthContext,
} from "@/integrations/supabase/auth-middleware";
import { checkTenantPermission } from "@/lib/users.functions";
import { resolveTenantId } from "@/lib/saas/tenant-context";

export interface TikTokAccountSummary {
  id: string;
  openId: string;
  unionId: string | null;
  displayName: string;
  avatarUrl: string | null;
  status: "active" | "disconnected" | "error";
  scopes: string[];
  tokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

async function requireIntegrationPermission(context: Partial<SupabaseAuthContext>) {
  const allowed = await checkTenantPermission("cms", context);
  if (!allowed) throw new Error("صلاحية مرفوضة: تتطلب صلاحية إدارة التكاملات.");
}

async function tenantIdFor(context: SupabaseAuthContext): Promise<string> {
  return resolveTenantId(context.supabase, { userId: context.userId });
}

export const listTikTokAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireIntegrationPermission(context);
    const tenantId = await tenantIdFor(context);

    const { data, error } = await context.supabase
      .from("tiktok_accounts")
      .select(
        "id,open_id,union_id,display_name,avatar_url,status,scopes,token_expires_at,refresh_token_expires_at,last_synced_at,created_at,updated_at",
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(`TIKTOK_ACCOUNTS_READ_FAILED:${error.code || "unknown"}`);

    return {
      ok: true,
      configured: Boolean(
        process.env.TIKTOK_CLIENT_KEY?.trim() &&
        process.env.TIKTOK_CLIENT_SECRET?.trim() &&
        process.env.TIKTOK_REDIRECT_URI?.trim() &&
        process.env.TIKTOK_TOKEN_ENCRYPTION_KEY?.trim(),
      ),
      accounts: (data || []).map((row): TikTokAccountSummary => ({
        id: row.id,
        openId: row.open_id,
        unionId: row.union_id,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        status: row.status as TikTokAccountSummary["status"],
        scopes: row.scopes || [],
        tokenExpiresAt: row.token_expires_at,
        refreshTokenExpiresAt: row.refresh_token_expires_at,
        lastSyncedAt: row.last_synced_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    };
  });

export const beginTikTokOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireIntegrationPermission(context);
    const tenantId = await tenantIdFor(context);
    const { beginTikTokOAuthTransaction } = await import("@/lib/tiktok.server");

    return beginTikTokOAuthTransaction({
      tenantId,
      userId: context.userId,
      returnTo: "/admin/integrations/tiktok",
    });
  });

export const refreshTikTokAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { accountId: string }) => ({
    accountId: z.string().uuid().parse(data.accountId),
  }))
  .handler(async ({ data, context }) => {
    await requireIntegrationPermission(context);
    const tenantId = await tenantIdFor(context);
    const { refreshStoredTikTokAccount } = await import("@/lib/tiktok.server");
    await refreshStoredTikTokAccount({ tenantId, accountId: data.accountId });
    return { ok: true };
  });

export const disconnectTikTokAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { accountId: string; confirmed: true }) => ({
    accountId: z.string().uuid().parse(data.accountId),
    confirmed: z.literal(true).parse(data.confirmed),
  }))
  .handler(async ({ data, context }) => {
    await requireIntegrationPermission(context);
    const tenantId = await tenantIdFor(context);
    const { disconnectStoredTikTokAccount } = await import("@/lib/tiktok.server");
    await disconnectStoredTikTokAccount({ tenantId, accountId: data.accountId });
    return { ok: true };
  });
