import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const STORE_ORIGIN = "https://indexes-store.vercel.app";
export const STORE_OAUTH_ISSUER = `${STORE_ORIGIN}/api/mcp/store/oauth`;
export const STORE_MCP_AUDIENCE = `${STORE_ORIGIN}/api/mcp/store`;
export const STORE_MCP_SCOPE = "store.read store.develop offline_access";
export const STORE_MCP_DISCOVERY_VERSION = "2.3.0";
const STORE_CLIENT_KIND = "store_client_v3";

const b64 = (value: Buffer | string) => Buffer.from(value).toString("base64url");

function secret() {
  const value = process.env.STORE_MCP_OAUTH_SECRET?.trim();
  if (!value || value.length < 32) throw new Error("STORE_MCP_OAUTH_NOT_CONFIGURED");
  return createHash("sha256").update("indexes-store-mcp-oauth-v1").update(value).digest();
}

function sign(payload: Record<string, unknown>) {
  const body = b64(JSON.stringify(payload));
  const signature = b64(createHmac("sha256", secret()).update(body).digest());
  return `${body}.${signature}`;
}

function verify(token: string): Record<string, unknown> {
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra) throw new Error("UNAUTHORIZED");
  const expected = createHmac("sha256", secret()).update(body).digest();
  const received = Buffer.from(signature, "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new Error("UNAUTHORIZED");
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Record<
    string,
    unknown
  >;
  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("UNAUTHORIZED");
  }
  return payload;
}

function validateRedirectUri(uri: string) {
  const url = new URL(uri);
  if (url.protocol !== "https:" || !["chatgpt.com", "chat.openai.com"].includes(url.hostname)) {
    throw new Error("INVALID_REDIRECT_URI");
  }
}

export const storeOauthMetadata = () => ({
  issuer: STORE_OAUTH_ISSUER,
  authorization_endpoint: `${STORE_OAUTH_ISSUER}/authorize`,
  token_endpoint: `${STORE_OAUTH_ISSUER}/token`,
  registration_endpoint: `${STORE_OAUTH_ISSUER}/register`,
  response_types_supported: ["code"],
  grant_types_supported: ["authorization_code", "refresh_token"],
  code_challenge_methods_supported: ["S256"],
  scopes_supported: ["store.read", "store.develop", "offline_access"],
  token_endpoint_auth_methods_supported: ["none"],
  service_documentation: `${STORE_ORIGIN}/mcp-store-authorize?discovery=${STORE_MCP_DISCOVERY_VERSION}`,
});

export const storeResourceMetadata = () => ({
  resource: STORE_MCP_AUDIENCE,
  authorization_servers: [STORE_OAUTH_ISSUER],
  scopes_supported: ["store.read", "store.develop", "offline_access"],
  bearer_methods_supported: ["header"],
  resource_documentation: `${STORE_ORIGIN}/mcp-store-authorize?discovery=${STORE_MCP_DISCOVERY_VERSION}`,
});

export function registerStoreClient(redirectUris: string[]) {
  if (!redirectUris.length || redirectUris.length > 5) throw new Error("INVALID_CLIENT");
  redirectUris.forEach(validateRedirectUri);
  return sign({
    kind: STORE_CLIENT_KIND,
    redirect_uris: redirectUris,
    exp: Math.floor(Date.now() / 1000) + 86400 * 30,
  });
}

export function validateStoreClient(clientId: string, redirectUri: string) {
  validateRedirectUri(redirectUri);
  const payload = verify(clientId);
  if (
    payload.kind !== STORE_CLIENT_KIND ||
    !Array.isArray(payload.redirect_uris) ||
    !payload.redirect_uris.includes(redirectUri)
  ) {
    throw new Error("INVALID_CLIENT");
  }
}

export function issueStoreCode(input: {
  sub: string;
  tenantId: string;
  clientId: string;
  redirectUri: string;
  challenge: string;
}) {
  return sign({
    kind: "store_code",
    sub: input.sub,
    tenant_id: input.tenantId,
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    challenge: input.challenge,
    scope: STORE_MCP_SCOPE,
    exp: Math.floor(Date.now() / 1000) + 300,
  });
}

function accessToken(sub: string, tenantId: string) {
  return sign({
    kind: "store_access",
    sub,
    tenant_id: tenantId,
    aud: STORE_MCP_AUDIENCE,
    scope: STORE_MCP_SCOPE,
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
}

function refreshToken(sub: string, tenantId: string) {
  return sign({
    kind: "store_refresh",
    sub,
    tenant_id: tenantId,
    aud: STORE_MCP_AUDIENCE,
    scope: STORE_MCP_SCOPE,
    exp: Math.floor(Date.now() / 1000) + 86400 * 30,
  });
}

export function exchangeStoreCode(
  code: string,
  clientId: string,
  redirectUri: string,
  verifier: string,
) {
  const payload = verify(code);
  const challenge = b64(createHash("sha256").update(verifier).digest());
  if (
    payload.kind !== "store_code" ||
    payload.client_id !== clientId ||
    payload.redirect_uri !== redirectUri ||
    payload.challenge !== challenge ||
    typeof payload.sub !== "string" ||
    typeof payload.tenant_id !== "string"
  ) {
    throw new Error("INVALID_GRANT");
  }
  return {
    accessToken: accessToken(payload.sub, payload.tenant_id),
    refreshToken: refreshToken(payload.sub, payload.tenant_id),
  };
}

export function exchangeStoreRefreshToken(token: string) {
  const payload = verify(token);
  if (
    payload.kind !== "store_refresh" ||
    payload.aud !== STORE_MCP_AUDIENCE ||
    payload.scope !== STORE_MCP_SCOPE ||
    typeof payload.sub !== "string" ||
    typeof payload.tenant_id !== "string"
  ) {
    throw new Error("INVALID_GRANT");
  }
  return {
    accessToken: accessToken(payload.sub, payload.tenant_id),
    refreshToken: refreshToken(payload.sub, payload.tenant_id),
  };
}

export function verifyStoreAccessToken(token: string) {
  const payload = verify(token);
  if (
    payload.kind !== "store_access" ||
    payload.aud !== STORE_MCP_AUDIENCE ||
    payload.scope !== STORE_MCP_SCOPE ||
    typeof payload.sub !== "string" ||
    typeof payload.tenant_id !== "string"
  ) {
    throw new Error("UNAUTHORIZED");
  }
  const scopes =
    typeof payload.scope === "string" ? payload.scope.split(/\s+/).filter(Boolean) : [];
  return { sub: payload.sub, tenantId: payload.tenant_id, scopes };
}
