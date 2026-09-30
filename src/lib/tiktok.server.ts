import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/integrations/supabase/client.server";

const DEFAULT_AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
const DEFAULT_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const DEFAULT_USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/";
const DEFAULT_SCOPE = "user.info.basic,user.info.profile,user.info.stats,video.list,video.upload";
const OAUTH_STATE_TTL_MS = 5 * 60 * 1000;

export interface TikTokTokenSet {
  accessToken: string;
  refreshToken: string;
  openId: string;
  scope: string[];
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface TikTokProfile {
  openId: string;
  unionId: string | null;
  displayName: string;
  avatarUrl: string | null;
}

interface TikTokOAuthConfig {
  clientKey: string;
  clientSecret: string;
  redirectUri: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
}

function readHttpsUrl(name: string, value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name}_INVALID_URL`);
  }
  if (url.protocol !== "https:") throw new Error(`${name}_MUST_BE_HTTPS`);
  return url.toString();
}

function config(): TikTokOAuthConfig {
  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim();
  const redirectUri = process.env.TIKTOK_REDIRECT_URI?.trim();
  const scope = process.env.TIKTOK_OAUTH_SCOPES?.trim() || DEFAULT_SCOPE;

  if (!clientKey) throw new Error("TIKTOK_CLIENT_KEY_NOT_CONFIGURED");
  if (!clientSecret) throw new Error("TIKTOK_CLIENT_SECRET_NOT_CONFIGURED");
  if (!redirectUri) throw new Error("TIKTOK_REDIRECT_URI_NOT_CONFIGURED");

  const redirect = readHttpsUrl("TIKTOK_REDIRECT_URI", redirectUri);
  const authorizeUrl = readHttpsUrl(
    "TIKTOK_AUTHORIZE_URL",
    process.env.TIKTOK_AUTHORIZE_URL?.trim() || DEFAULT_AUTHORIZE_URL,
  );
  const tokenUrl = readHttpsUrl(
    "TIKTOK_TOKEN_URL",
    process.env.TIKTOK_TOKEN_URL?.trim() || DEFAULT_TOKEN_URL,
  );
  const userInfoUrl = readHttpsUrl(
    "TIKTOK_USER_INFO_URL",
    process.env.TIKTOK_USER_INFO_URL?.trim() || DEFAULT_USER_INFO_URL,
  );

  // Fail closed if a typo or environment override points credentials at a non-TikTok host.
  if (new URL(authorizeUrl).hostname !== "www.tiktok.com") {
    throw new Error("TIKTOK_AUTHORIZE_URL_HOST_INVALID");
  }
  if (new URL(tokenUrl).hostname !== "open.tiktokapis.com") {
    throw new Error("TIKTOK_TOKEN_URL_HOST_INVALID");
  }
  if (new URL(userInfoUrl).hostname !== "open.tiktokapis.com") {
    throw new Error("TIKTOK_USER_INFO_URL_HOST_INVALID");
  }

  encryptionKey();

  return {
    clientKey,
    clientSecret,
    redirectUri: redirect,
    authorizeUrl,
    tokenUrl,
    userInfoUrl,
    scope,
  };
}

function encryptionKey(): Buffer {
  const raw = process.env.TIKTOK_TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error("TIKTOK_TOKEN_ENCRYPTION_KEY_NOT_CONFIGURED");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("TIKTOK_TOKEN_ENCRYPTION_KEY_INVALID");
  return key;
}

export function encryptTikTokSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptTikTokSecret(packed: string): string {
  const [version, ivRaw, tagRaw, ciphertextRaw] = packed.split(".");
  if (version !== "v1" || !ivRaw || !tagRaw || !ciphertextRaw) {
    throw new Error("TIKTOK_ENCRYPTED_SECRET_INVALID");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivRaw, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function normalizeTikTokReturnTo(value: string | undefined): string {
  if (!value) return "/admin/integrations/tiktok";
  if (!value.startsWith("/admin/integrations/tiktok")) {
    return "/admin/integrations/tiktok";
  }
  return value;
}

export function buildTikTokAuthorizationUrl(input: { state: string; returnTo?: string }): string {
  const cfg = config();
  const url = new URL(cfg.authorizeUrl);
  url.searchParams.set("client_key", cfg.clientKey);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", cfg.scope);
  url.searchParams.set("redirect_uri", cfg.redirectUri);
  url.searchParams.set("state", input.state);
  return url.toString();
}

function stateHash(state: string): string {
  return createHash("sha256").update(state).digest("hex");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function parseTikTokTokenResponse(payload: unknown): TikTokTokenSet {
  const root = asRecord(payload);
  const data = asRecord(root.data);
  const source = Object.keys(data).length > 0 ? data : root;

  const accessToken = typeof source.access_token === "string" ? source.access_token.trim() : "";
  const refreshToken = typeof source.refresh_token === "string" ? source.refresh_token.trim() : "";
  const openId = typeof source.open_id === "string" ? source.open_id.trim() : "";
  const scopeRaw = typeof source.scope === "string" ? source.scope : "";
  const expiresIn = Number(source.expires_in || 0);
  const refreshExpiresIn = Number(source.refresh_expires_in || 0);

  if (!accessToken || !refreshToken || !openId || !Number.isFinite(expiresIn)) {
    throw new Error("TIKTOK_TOKEN_RESPONSE_INVALID");
  }

  return {
    accessToken,
    refreshToken,
    openId,
    scope: scopeRaw
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean),
    expiresIn: Math.max(0, expiresIn),
    refreshExpiresIn: Number.isFinite(refreshExpiresIn) ? Math.max(0, refreshExpiresIn) : 0,
  };
}

export function parseTikTokProfile(payload: unknown, fallbackOpenId: string): TikTokProfile {
  const root = asRecord(payload);
  const providerError = asRecord(root.error);
  const providerCode = providerError.code;
  if (providerCode != null && providerCode !== 0 && providerCode !== "0" && providerCode !== "ok") {
    throw new Error("TIKTOK_PROFILE_PROVIDER_ERROR");
  }

  const data = asRecord(root.data);
  const user = asRecord(data.user);
  const openId =
    typeof user.open_id === "string" && user.open_id.trim() ? user.open_id.trim() : fallbackOpenId;
  if (!openId) throw new Error("TIKTOK_PROFILE_OPEN_ID_MISSING");

  return {
    openId,
    unionId:
      typeof user.union_id === "string" && user.union_id.trim() ? user.union_id.trim() : null,
    displayName:
      typeof user.display_name === "string" && user.display_name.trim()
        ? user.display_name.trim()
        : "TikTok account",
    avatarUrl:
      typeof user.avatar_url === "string" && user.avatar_url.trim() ? user.avatar_url.trim() : null,
  };
}

async function exchangeAuthorizationCode(code: string): Promise<TikTokTokenSet> {
  const cfg = config();
  const response = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_key: cfg.clientKey,
      client_secret: cfg.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: cfg.redirectUri,
    }),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error(`TIKTOK_TOKEN_${response.status}`);
  }
  return parseTikTokTokenResponse(await response.json());
}

async function refreshAccessToken(refreshToken: string): Promise<TikTokTokenSet> {
  const cfg = config();
  const response = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_key: cfg.clientKey,
      client_secret: cfg.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error(`TIKTOK_REFRESH_${response.status}`);
  }
  return parseTikTokTokenResponse(await response.json());
}

async function fetchProfile(accessToken: string, openId: string): Promise<TikTokProfile> {
  const cfg = config();
  const url = new URL(cfg.userInfoUrl);
  url.searchParams.set("fields", "open_id,union_id,avatar_url,display_name");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error(`TIKTOK_PROFILE_${response.status}`);
  }

  return parseTikTokProfile(await response.json(), openId);
}

export async function beginTikTokOAuthTransaction(input: {
  tenantId: string;
  userId: string;
  returnTo?: string;
}): Promise<{ authorizationUrl: string; deviceUrl: string }> {
  const cfg = config();

  const admin = getSupabaseAdmin();
  const state = randomBytes(32).toString("base64url");
  const deviceCode = randomBytes(32).toString("base64url");
  const now = Date.now();
  const expiresAt = new Date(now + OAUTH_STATE_TTL_MS).toISOString();

  await admin.from("tiktok_oauth_states").delete().lt("expires_at", new Date(now).toISOString());

  const { error } = await admin.from("tiktok_oauth_states").insert({
    state_hash: stateHash(state),
    state_encrypted: encryptTikTokSecret(state),
    device_code_hash: stateHash(deviceCode),
    tenant_id: input.tenantId,
    user_id: input.userId,
    return_to: normalizeTikTokReturnTo(input.returnTo),
    expires_at: expiresAt,
  });
  if (error) throw new Error(`TIKTOK_OAUTH_STATE_STORE_FAILED:${error.code || "unknown"}`);

  const origin = new URL(cfg.redirectUri).origin;
  const deviceUrl = new URL("/api/tiktok/device", origin);
  deviceUrl.searchParams.set("code", deviceCode);

  return {
    authorizationUrl: buildTikTokAuthorizationUrl({ state }),
    deviceUrl: deviceUrl.toString(),
  };
}

export async function resolveTikTokDeviceAuthorization(deviceCode: string): Promise<string> {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(deviceCode)) {
    throw new Error("TIKTOK_DEVICE_CODE_INVALID");
  }

  const admin = getSupabaseAdmin();
  const { data: transaction, error } = await admin
    .from("tiktok_oauth_states")
    .select("state_hash,state_encrypted,expires_at")
    .eq("device_code_hash", stateHash(deviceCode))
    .maybeSingle();

  if (error || !transaction) throw new Error("TIKTOK_DEVICE_CODE_NOT_FOUND");
  if (new Date(transaction.expires_at).getTime() <= Date.now()) {
    throw new Error("TIKTOK_DEVICE_CODE_EXPIRED");
  }

  const state = decryptTikTokSecret(transaction.state_encrypted);
  if (stateHash(state) !== transaction.state_hash) {
    throw new Error("TIKTOK_DEVICE_STATE_MISMATCH");
  }

  return buildTikTokAuthorizationUrl({ state });
}

export async function completeTikTokOAuth(input: {
  code: string;
  state: string;
}): Promise<{ returnTo: string }> {
  const admin = getSupabaseAdmin();
  const hash = stateHash(input.state);
  const { data: transaction, error: stateError } = await admin
    .from("tiktok_oauth_states")
    .select("state_hash,tenant_id,user_id,return_to,expires_at")
    .eq("state_hash", hash)
    .maybeSingle();

  if (stateError || !transaction) throw new Error("TIKTOK_OAUTH_STATE_INVALID");

  await admin.from("tiktok_oauth_states").delete().eq("state_hash", hash);

  if (new Date(transaction.expires_at).getTime() <= Date.now()) {
    throw new Error("TIKTOK_OAUTH_STATE_EXPIRED");
  }

  const token = await exchangeAuthorizationCode(input.code);
  const profile = await fetchProfile(token.accessToken, token.openId);
  if (profile.openId !== token.openId) {
    throw new Error("TIKTOK_OPEN_ID_MISMATCH");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + token.expiresIn * 1000).toISOString();
  const refreshExpiresAt =
    token.refreshExpiresIn > 0
      ? new Date(now.getTime() + token.refreshExpiresIn * 1000).toISOString()
      : null;

  const { data: account, error: accountError } = await admin
    .from("tiktok_accounts")
    .upsert(
      {
        tenant_id: transaction.tenant_id,
        open_id: profile.openId,
        union_id: profile.unionId,
        display_name: profile.displayName,
        avatar_url: profile.avatarUrl,
        status: "active",
        scopes: token.scope,
        token_expires_at: expiresAt,
        refresh_token_expires_at: refreshExpiresAt,
        last_synced_at: now.toISOString(),
        updated_at: now.toISOString(),
        created_by: transaction.user_id,
      },
      { onConflict: "tenant_id,open_id" },
    )
    .select("id")
    .single();

  if (accountError || !account) {
    throw new Error(`TIKTOK_ACCOUNT_STORE_FAILED:${accountError?.code || "unknown"}`);
  }

  const { error: secretError } = await admin.from("tiktok_account_secrets").upsert({
    account_id: account.id,
    access_token_encrypted: encryptTikTokSecret(token.accessToken),
    refresh_token_encrypted: encryptTikTokSecret(token.refreshToken),
    updated_at: now.toISOString(),
  });
  if (secretError) {
    await admin
      .from("tiktok_accounts")
      .update({ status: "error", updated_at: new Date().toISOString() })
      .eq("id", account.id);
    throw new Error(`TIKTOK_SECRET_STORE_FAILED:${secretError.code || "unknown"}`);
  }

  return { returnTo: normalizeTikTokReturnTo(transaction.return_to) };
}

export async function refreshStoredTikTokAccount(input: {
  tenantId: string;
  accountId: string;
}): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data: account, error: accountError } = await admin
    .from("tiktok_accounts")
    .select("id,tenant_id,open_id")
    .eq("id", input.accountId)
    .eq("tenant_id", input.tenantId)
    .maybeSingle();
  if (accountError || !account) throw new Error("TIKTOK_ACCOUNT_NOT_FOUND");

  const { data: secret, error: secretError } = await admin
    .from("tiktok_account_secrets")
    .select("access_token_encrypted,refresh_token_encrypted")
    .eq("account_id", account.id)
    .maybeSingle();
  if (secretError || !secret) throw new Error("TIKTOK_ACCOUNT_SECRET_NOT_FOUND");

  const currentRefreshToken = decryptTikTokSecret(secret.refresh_token_encrypted);
  const token = await refreshAccessToken(currentRefreshToken);
  const profile = await fetchProfile(token.accessToken, token.openId);
  if (profile.openId !== account.open_id) throw new Error("TIKTOK_OPEN_ID_MISMATCH");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + token.expiresIn * 1000).toISOString();
  const refreshExpiresAt =
    token.refreshExpiresIn > 0
      ? new Date(now.getTime() + token.refreshExpiresIn * 1000).toISOString()
      : null;

  const { error: updateError } = await admin
    .from("tiktok_accounts")
    .update({
      union_id: profile.unionId,
      display_name: profile.displayName,
      avatar_url: profile.avatarUrl,
      status: "active",
      scopes: token.scope,
      token_expires_at: expiresAt,
      refresh_token_expires_at: refreshExpiresAt,
      last_synced_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", account.id)
    .eq("tenant_id", input.tenantId);
  if (updateError) throw new Error("TIKTOK_ACCOUNT_REFRESH_STORE_FAILED");

  const { error: secretUpdateError } = await admin
    .from("tiktok_account_secrets")
    .update({
      access_token_encrypted: encryptTikTokSecret(token.accessToken),
      refresh_token_encrypted: encryptTikTokSecret(token.refreshToken),
      updated_at: now.toISOString(),
    })
    .eq("account_id", account.id);
  if (secretUpdateError) throw new Error("TIKTOK_ACCOUNT_SECRET_REFRESH_FAILED");
}

export async function disconnectStoredTikTokAccount(input: {
  tenantId: string;
  accountId: string;
}): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data: account, error } = await admin
    .from("tiktok_accounts")
    .select("id")
    .eq("id", input.accountId)
    .eq("tenant_id", input.tenantId)
    .maybeSingle();
  if (error || !account) throw new Error("TIKTOK_ACCOUNT_NOT_FOUND");

  const { error: secretDeleteError } = await admin
    .from("tiktok_account_secrets")
    .delete()
    .eq("account_id", account.id);
  if (secretDeleteError) throw new Error("TIKTOK_ACCOUNT_SECRET_DELETE_FAILED");

  const { error: accountUpdateError } = await admin
    .from("tiktok_accounts")
    .update({
      status: "disconnected",
      token_expires_at: null,
      refresh_token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", account.id)
    .eq("tenant_id", input.tenantId);
  if (accountUpdateError) throw new Error("TIKTOK_ACCOUNT_DISCONNECT_FAILED");
}
