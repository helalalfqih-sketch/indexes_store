import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { WhapiError } from "../whapi.server";

const ISSUER = "https://indexes-store.vercel.app";
const AUDIENCE = `${ISSUER}/api/mcp/whatsapp`;
const SCOPE = "whatsapp.read whatsapp.write offline_access";
const CHATGPT_CLIENT_ID = "indexes_whatsapp_chatgpt";
const CHATGPT_CALLBACK = "https://chatgpt.com/connector/oauth/P1JNErjTS0-9";
const b64 = (v: Buffer | string) => Buffer.from(v).toString("base64url");

const secret = () => {
  const s = process.env.WHAPI_WEBHOOK_SECRET;
  if (!s || s.length < 32) throw new WhapiError("OAUTH_NOT_CONFIGURED", 503);
  return createHash("sha256").update("indexes-mcp-oauth-v1").update(s).digest();
};

function sign(payload: Record<string, unknown>) {
  const body = b64(JSON.stringify(payload));
  const sig = b64(createHmac("sha256", secret()).update(body).digest());
  return `${body}.${sig}`;
}

function verify(token: string): Record<string, unknown> {
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra) throw new WhapiError("UNAUTHORIZED", 401);
  const expected = createHmac("sha256", secret()).update(body).digest();
  const got = Buffer.from(sig, "base64url");
  if (got.length !== expected.length || !timingSafeEqual(got, expected))
    throw new WhapiError("UNAUTHORIZED", 401);
  const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Record<
    string,
    unknown
  >;
  if (typeof data.exp !== "number" || data.exp < Math.floor(Date.now() / 1000))
    throw new WhapiError("UNAUTHORIZED", 401);
  return data;
}

export const oauthMetadata = () => ({
  issuer: ISSUER,
  authorization_endpoint: `${ISSUER}/api/mcp/oauth/authorize`,
  token_endpoint: `${ISSUER}/api/mcp/oauth/token`,
  registration_endpoint: `${ISSUER}/api/mcp/oauth/register`,
  response_types_supported: ["code"],
  grant_types_supported: ["authorization_code", "refresh_token"],
  code_challenge_methods_supported: ["S256"],
  scopes_supported: ["whatsapp.read", "whatsapp.write", "offline_access"],
  token_endpoint_auth_methods_supported: ["none"],
});

export const resourceMetadata = () => ({
  resource: AUDIENCE,
  authorization_servers: [ISSUER],
  scopes_supported: ["whatsapp.read", "whatsapp.write", "offline_access"],
  bearer_methods_supported: ["header"],
});

export function registerClient(redirectUris: string[]) {
  if (!redirectUris.length || redirectUris.length > 5) throw new WhapiError("INVALID_CLIENT", 400);
  for (const uri of redirectUris) {
    const u = new URL(uri);
    if (u.protocol !== "https:" || !["chatgpt.com", "chat.openai.com"].includes(u.hostname))
      throw new WhapiError("INVALID_REDIRECT_URI", 400);
  }
  return sign({
    kind: "client",
    redirect_uris: redirectUris,
    exp: Math.floor(Date.now() / 1000) + 86400 * 30,
  });
}

export function validateClient(clientId: string, redirectUri: string) {
  if (clientId === CHATGPT_CLIENT_ID) {
    if (redirectUri !== CHATGPT_CALLBACK) throw new WhapiError("INVALID_REDIRECT_URI", 400);
    return;
  }
  const data = verify(clientId);
  if (
    data.kind !== "client" ||
    !Array.isArray(data.redirect_uris) ||
    !data.redirect_uris.includes(redirectUri)
  )
    throw new WhapiError("INVALID_CLIENT", 400);
}

export function issueCode(input: {
  sub: string;
  clientId: string;
  redirectUri: string;
  challenge: string;
}) {
  return sign({
    kind: "code",
    sub: input.sub,
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    challenge: input.challenge,
    scope: SCOPE,
    exp: Math.floor(Date.now() / 1000) + 300,
  });
}

export function exchangeCode(
  code: string,
  clientId: string,
  redirectUri: string,
  verifier: string,
) {
  const data = verify(code);
  const challenge = b64(createHash("sha256").update(verifier).digest());
  if (
    data.kind !== "code" ||
    data.client_id !== clientId ||
    data.redirect_uri !== redirectUri ||
    data.challenge !== challenge
  )
    throw new WhapiError("INVALID_GRANT", 400);
  return sign({
    kind: "access",
    sub: data.sub,
    aud: AUDIENCE,
    scope: SCOPE,
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
}

export function issueRefreshToken(sub: string) {
  return sign({
    kind: "refresh",
    sub,
    aud: AUDIENCE,
    scope: SCOPE,
    exp: Math.floor(Date.now() / 1000) + 86400 * 30,
  });
}

export function exchangeRefreshToken(refreshToken: string) {
  const data = verify(refreshToken);
  if (
    data.kind !== "refresh" ||
    data.aud !== AUDIENCE ||
    data.scope !== SCOPE ||
    typeof data.sub !== "string"
  )
    throw new WhapiError("INVALID_GRANT", 400);
  return {
    accessToken: sign({
      kind: "access",
      sub: data.sub,
      aud: AUDIENCE,
      scope: SCOPE,
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
    refreshToken: issueRefreshToken(data.sub),
  };
}

export function verifyAccessToken(token: string) {
  const data = verify(token);
  if (
    data.kind !== "access" ||
    data.aud !== AUDIENCE ||
    data.scope !== SCOPE ||
    typeof data.sub !== "string"
  )
    throw new WhapiError("UNAUTHORIZED", 401);
  return data.sub;
}

export { ISSUER, AUDIENCE, SCOPE, CHATGPT_CLIENT_ID, CHATGPT_CALLBACK };
