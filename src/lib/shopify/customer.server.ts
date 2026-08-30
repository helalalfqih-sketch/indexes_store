import crypto from "node:crypto";

const SESSION_COOKIE = "indexes_shopify_customer";
const OAUTH_COOKIE = "indexes_shopify_oauth";
const API_VERSION = process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_VERSION || "2026-04";

type Discovery = {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint?: string;
};

export type CustomerSession = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;
};

type OAuthTransaction = { state: string; nonce: string; verifier: string; returnTo: string };

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function storefrontOrigin() {
  const domain = required("SHOPIFY_STORE_DOMAIN")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  return `https://${domain}`;
}

function cookieSecret() {
  return crypto.createHash("sha256").update(required("SHOPIFY_CUSTOMER_SESSION_SECRET")).digest();
}

function seal(value: unknown) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", cookieSecret(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

function unseal<T>(value: string | undefined): T | null {
  if (!value) return null;
  try {
    const raw = Buffer.from(value, "base64url");
    const decipher = crypto.createDecipheriv("aes-256-gcm", cookieSecret(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return JSON.parse(
      Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8"),
    ) as T;
  } catch {
    return null;
  }
}

function parseCookie(request: Request, name: string) {
  const entry = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : undefined;
}

export function sessionCookie(session: CustomerSession, maxAge?: number) {
  const ttl = maxAge ?? Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
  return `${SESSION_COOKIE}=${encodeURIComponent(seal(session))}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${ttl}`;
}

export function oauthCookie(transaction: OAuthTransaction) {
  return `${OAUTH_COOKIE}=${encodeURIComponent(seal(transaction))}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;
}

export function clearCustomerCookies() {
  return [SESSION_COOKIE, OAUTH_COOKIE].map(
    (name) => `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  );
}

export async function discovery(): Promise<Discovery> {
  const response = await fetch(`${storefrontOrigin()}/.well-known/openid-configuration`);
  if (!response.ok) throw new Error(`Customer Account discovery failed: ${response.status}`);
  return response.json() as Promise<Discovery>;
}

export async function customerApiEndpoint() {
  const response = await fetch(`${storefrontOrigin()}/.well-known/customer-account-api`);
  if (!response.ok) throw new Error(`Customer API discovery failed: ${response.status}`);
  const config = (await response.json()) as { graphql_api?: string; graphql_endpoint?: string };
  const endpoint = config.graphql_api || config.graphql_endpoint;
  if (!endpoint) throw new Error("Customer API discovery returned no GraphQL endpoint");
  return endpoint.replace(/\/unstable\//, `/${API_VERSION}/`);
}

function challenge(verifier: string) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export async function beginCustomerLogin(returnTo = "/account") {
  const config = await discovery();
  const transaction: OAuthTransaction = {
    state: crypto.randomBytes(24).toString("base64url"),
    nonce: crypto.randomBytes(24).toString("base64url"),
    verifier: crypto.randomBytes(48).toString("base64url"),
    returnTo: returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/account",
  };
  const url = new URL(config.authorization_endpoint);
  url.search = new URLSearchParams({
    client_id: required("SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID"),
    response_type: "code",
    redirect_uri: required("SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI"),
    scope: "openid email customer-account-api:full",
    state: transaction.state,
    nonce: transaction.nonce,
    code_challenge: challenge(transaction.verifier),
    code_challenge_method: "S256",
  }).toString();
  return { url: url.toString(), transaction };
}

async function tokenRequest(params: URLSearchParams) {
  const config = await discovery();
  const response = await fetch(config.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
    expires_in?: number;
    error_description?: string;
  };
  if (!response.ok || !payload.access_token)
    throw new Error(
      payload.error_description || `Customer token exchange failed: ${response.status}`,
    );
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    idToken: payload.id_token,
    expiresAt: Date.now() + (payload.expires_in || 3600) * 1000,
  } satisfies CustomerSession;
}

export async function finishCustomerLogin(request: Request, code: string, state: string) {
  const transaction = unseal<OAuthTransaction>(parseCookie(request, OAUTH_COOKIE));
  if (!transaction || !crypto.timingSafeEqual(Buffer.from(transaction.state), Buffer.from(state)))
    throw new Error("Invalid OAuth state");
  const session = await tokenRequest(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: required("SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID"),
      redirect_uri: required("SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI"),
      code_verifier: transaction.verifier,
    }),
  );
  return { session, returnTo: transaction.returnTo };
}

export async function getCustomerSession(request: Request) {
  let session = unseal<CustomerSession>(parseCookie(request, SESSION_COOKIE));
  if (!session) return null;
  if (session.expiresAt > Date.now() + 60_000) return { session, refreshed: false };
  if (!session.refreshToken) return null;
  session = await tokenRequest(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
      client_id: required("SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID"),
    }),
  );
  return { session, refreshed: true };
}

export async function customerGraphql<T>(
  session: CustomerSession,
  query: string,
  variables: Record<string, unknown> = {},
) {
  const response = await fetch(await customerApiEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: session.accessToken },
    body: JSON.stringify({ query, variables }),
  });
  const payload = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (!response.ok || payload.errors?.length || !payload.data)
    throw new Error(
      payload.errors?.map((error) => error.message).join("; ") ||
        `Customer API failed: ${response.status}`,
    );
  return payload.data;
}

export async function logoutUrl(idToken?: string) {
  const endpoint = (await discovery()).end_session_endpoint;
  if (!endpoint) return "/";
  const url = new URL(endpoint);
  if (idToken) url.searchParams.set("id_token_hint", idToken);
  url.searchParams.set(
    "post_logout_redirect_uri",
    process.env.SHOPIFY_CUSTOMER_LOGOUT_REDIRECT_URI || storefrontOrigin(),
  );
  return url.toString();
}
