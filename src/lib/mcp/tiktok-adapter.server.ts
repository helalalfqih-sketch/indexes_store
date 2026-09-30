import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import {
  beginTikTokOAuthTransaction,
  disconnectStoredTikTokAccount,
  refreshStoredTikTokAccount,
} from "@/lib/tiktok.server";

export interface TikTokMcpAdapter {
  listAccounts(): Promise<Record<string, unknown>>;
  getAccount(accountId: string): Promise<Record<string, unknown>>;
  startLink(): Promise<Record<string, unknown>>;
  refreshAccount(accountId: string): Promise<Record<string, unknown>>;
  disconnectAccount(accountId: string): Promise<Record<string, unknown>>;
}

const ACCOUNT_SELECT =
  "id,open_id,union_id,display_name,avatar_url,status,scopes,token_expires_at,refresh_token_expires_at,last_synced_at,created_at,updated_at";

function accountView(row: Record<string, any>) {
  return {
    id: row.id,
    open_id: row.open_id,
    union_id: row.union_id,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    status: row.status,
    scopes: row.scopes || [],
    token_expires_at: row.token_expires_at,
    refresh_token_expires_at: row.refresh_token_expires_at,
    last_synced_at: row.last_synced_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function createTikTokMcpAdapter(tenantId: string, userId: string): TikTokMcpAdapter {
  const admin = getSupabaseAdmin();

  async function getAccountRow(accountId: string) {
    const { data, error } = await admin
      .from("tiktok_accounts")
      .select(ACCOUNT_SELECT)
      .eq("tenant_id", tenantId)
      .eq("id", accountId)
      .maybeSingle();

    if (error) throw new Error("TIKTOK_ACCOUNT_READ_FAILED");
    return data;
  }

  return {
    async listAccounts() {
      const { data, error } = await admin
        .from("tiktok_accounts")
        .select(ACCOUNT_SELECT)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true });

      if (error) throw new Error("TIKTOK_ACCOUNTS_READ_FAILED");
      return {
        accounts: (data || []).map((row) => accountView(row as Record<string, any>)),
        secret_fields_included: false,
      };
    },

    async getAccount(accountId: string) {
      const row = await getAccountRow(accountId);
      return {
        found: Boolean(row),
        account: row ? accountView(row as Record<string, any>) : null,
        secret_fields_included: false,
      };
    },

    async startLink() {
      const { deviceUrl } = await beginTikTokOAuthTransaction({
        tenantId,
        userId,
        returnTo: "/admin/integrations/tiktok",
      });
      return {
        device_url: deviceUrl,
        expires_in_seconds: 300,
        contains_provider_secret: false,
      };
    },

    async refreshAccount(accountId: string) {
      await refreshStoredTikTokAccount({ tenantId, accountId });
      const row = await getAccountRow(accountId);
      return {
        ok: true,
        account: row ? accountView(row as Record<string, any>) : null,
        secret_fields_included: false,
      };
    },

    async disconnectAccount(accountId: string) {
      await disconnectStoredTikTokAccount({ tenantId, accountId });
      const row = await getAccountRow(accountId);
      return {
        ok: true,
        account: row ? accountView(row as Record<string, any>) : null,
        local_tokens_deleted: true,
        provider_authorization_revoked: false,
      };
    },
  };
}
