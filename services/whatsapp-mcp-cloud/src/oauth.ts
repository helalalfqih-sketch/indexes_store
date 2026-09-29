import { randomUUID } from "node:crypto";
import { config } from "./config.js";
import { pkceS256, signPayload, verifyPayload } from "./crypto.js";
import { consumeAuthorizationCode } from "./replay-store.js";
import { sessions } from "./session-manager.js";

const now = () => Math.floor(Date.now() / 1000);
const html = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

interface ClientToken extends Record<string, unknown> {
  typ: "client";
  redirects: string[];
  exp: number;
}
interface LinkTicket extends Record<string, unknown> {
  typ: "link";
  sid: string;
  jti: string;
  clientId: string;
  redirectUri: string;
  state: string;
  challenge: string;
  exp: number;
}
interface AuthCode extends Record<string, unknown> {
  typ: "code";
  sid: string;
  jti: string;
  clientId: string;
  redirectUri: string;
  challenge: string;
  exp: number;
}
interface AccessToken extends Record<string, unknown> {
  typ: "access";
  sid: string;
  scope: string;
  exp: number;
}
interface RefreshToken extends Record<string, unknown> {
  typ: "refresh";
  sid: string;
  scope: string;
  exp: number;
}

function assertRedirect(uri: string): void {
  const parsed = new URL(uri);
  if (parsed.protocol !== "https:" || !config.redirectHosts.has(parsed.hostname.toLowerCase())) {
    throw new Error("REDIRECT_URI_NOT_ALLOWED");
  }
}

export function oauthMetadata() {
  return {
    issuer: config.origin,
    authorization_endpoint: `${config.origin}/oauth/authorize`,
    token_endpoint: `${config.origin}/oauth/token`,
    registration_endpoint: `${config.origin}/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: ["whatsapp.read", "whatsapp.write", "offline_access"],
    token_endpoint_auth_methods_supported: ["none"],
  };
}

export function resourceMetadata() {
  return {
    resource: `${config.origin}/mcp`,
    authorization_servers: [config.origin],
    scopes_supported: ["whatsapp.read", "whatsapp.write", "offline_access"],
    bearer_methods_supported: ["header"],
  };
}

export function registerClient(body: unknown) {
  const input = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const redirects = Array.isArray(input.redirect_uris)
    ? input.redirect_uris.filter((v): v is string => typeof v === "string")
    : [];
  if (!redirects.length || redirects.length > 10) throw new Error("INVALID_REDIRECT_URIS");
  redirects.forEach(assertRedirect);
  const clientId = signPayload({
    typ: "client",
    redirects,
    exp: now() + 365 * 24 * 60 * 60,
  });
  return {
    client_id: clientId,
    client_id_issued_at: now(),
    redirect_uris: redirects,
    token_endpoint_auth_method: "none",
  };
}

function validateAuthorize(input: URLSearchParams) {
  const clientId = input.get("client_id") ?? "";
  const redirectUri = input.get("redirect_uri") ?? "";
  const state = input.get("state") ?? "";
  const challenge = input.get("code_challenge") ?? "";
  const method = input.get("code_challenge_method") ?? "S256";
  if (!clientId || !redirectUri || !state || !challenge || method !== "S256") {
    throw new Error("INVALID_AUTHORIZE_REQUEST");
  }
  const client = verifyPayload<ClientToken>(clientId);
  if (client.typ !== "client" || !client.redirects.includes(redirectUri)) {
    throw new Error("INVALID_CLIENT");
  }
  assertRedirect(redirectUri);
  return { clientId, redirectUri, state, challenge };
}

export function authorizePage(params: URLSearchParams): string {
  const valid = validateAuthorize(params);
  const hidden = [
    ["client_id", valid.clientId],
    ["redirect_uri", valid.redirectUri],
    ["state", valid.state],
    ["code_challenge", valid.challenge],
  ]
    .map(([name, value]) => `<input type="hidden" name="${name}" value="${html(value)}">`)
    .join("");
  const gate = config.publicSignup
    ? ""
    : '<label>رمز ربط الإدارة<input name="invite" type="password" autocomplete="one-time-code" required></label>';
  return `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ربط WhatsApp MCP</title><style>body{font-family:system-ui;max-width:520px;margin:8vh auto;padding:24px}form{display:grid;gap:16px}input,button{font:inherit;padding:12px;border:1px solid #bbb;border-radius:10px}button{cursor:pointer;font-weight:700}</style>
<h1>ربط WhatsApp مع ChatGPT</h1><p>سيظهر رمز QR. افتح WhatsApp ← الأجهزة المرتبطة ← ربط جهاز، ثم امسح الرمز بنفسك.</p>
<form method="post" action="/oauth/authorize/start">${hidden}${gate}<button type="submit">إظهار QR</button></form></html>`;
}

export async function startAuthorization(form: FormData): Promise<string> {
  const params = new URLSearchParams();
  for (const key of ["client_id", "redirect_uri", "state", "code_challenge"]) {
    const value = form.get(key);
    if (typeof value === "string") params.set(key, value);
  }
  params.set("code_challenge_method", "S256");
  const valid = validateAuthorize(params);
  if (!config.publicSignup) {
    const invite = form.get("invite");
    if (typeof invite !== "string" || invite !== config.inviteSecret) throw new Error("INVALID_INVITE");
  }
  const sid = sessions.createSessionId();
  await sessions.start(sid);
  const ticket = signPayload({
    typ: "link",
    sid,
    jti: randomUUID(),
    clientId: valid.clientId,
    redirectUri: valid.redirectUri,
    state: valid.state,
    challenge: valid.challenge,
    exp: now() + 10 * 60,
  });
  return `${config.origin}/link?ticket=${encodeURIComponent(ticket)}`;
}

export function linkPage(ticket: string): string {
  const parsed = verifyPayload<LinkTicket>(ticket);
  if (parsed.typ !== "link") throw new Error("INVALID_LINK_TICKET");
  return `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>QR WhatsApp</title><style>body{font-family:system-ui;text-align:center;max-width:520px;margin:5vh auto;padding:24px}img{width:min(360px,90vw);height:auto}.muted{color:#666}</style>
<h1>اربط جهاز WhatsApp</h1><p>WhatsApp ← الإعدادات ← الأجهزة المرتبطة ← ربط جهاز</p><div id="state">جارٍ تجهيز QR…</div><img id="qr" alt="QR" hidden><p class="muted">لا تشارك هذا الرمز مع أي شخص.</p>
<script>
const ticket=${JSON.stringify(ticket)};
async function poll(){
  const r=await fetch('/link/status?ticket='+encodeURIComponent(ticket),{cache:'no-store'});
  if(!r.ok){document.getElementById('state').textContent='تعذر التحقق من حالة الربط';return}
  const d=await r.json();
  document.getElementById('state').textContent=d.status;
  if(d.qr){const img=document.getElementById('qr');img.src=d.qr;img.hidden=false}
  if(d.redirect){location.assign(d.redirect);return}
  setTimeout(poll,1500);
}
poll();
</script></html>`;
}

export async function linkStatus(ticket: string) {
  const parsed = verifyPayload<LinkTicket>(ticket);
  if (parsed.typ !== "link") throw new Error("INVALID_LINK_TICKET");
  const status = sessions.status(parsed.sid);
  const qr = status.hasQr ? await sessions.qrDataUrl(parsed.sid) : null;
  let redirect: string | null = null;
  if (status.status === "open") {
    const code = signPayload({
      typ: "code",
      sid: parsed.sid,
      jti: parsed.jti,
      clientId: parsed.clientId,
      redirectUri: parsed.redirectUri,
      challenge: parsed.challenge,
      exp: now() + 5 * 60,
    });
    const callback = new URL(parsed.redirectUri);
    callback.searchParams.set("code", code);
    callback.searchParams.set("state", parsed.state);
    redirect = callback.toString();
  }
  return { status: status.status, qr, redirect };
}

export async function tokenResponse(form: URLSearchParams) {
  const grant = form.get("grant_type");
  const clientId = form.get("client_id") ?? "";
  if (grant === "authorization_code") {
    const code = form.get("code") ?? "";
    const redirectUri = form.get("redirect_uri") ?? "";
    const verifier = form.get("code_verifier") ?? "";
    const parsed = verifyPayload<AuthCode>(code);
    if (
      parsed.typ !== "code" ||
      parsed.clientId !== clientId ||
      parsed.redirectUri !== redirectUri ||
      pkceS256(verifier) !== parsed.challenge
    ) {
      throw new Error("INVALID_GRANT");
    }
    await consumeAuthorizationCode(code, parsed.exp);
    return issueTokens(parsed.sid);
  }
  if (grant === "refresh_token") {
    const refresh = form.get("refresh_token") ?? "";
    const parsed = verifyPayload<RefreshToken>(refresh);
    if (parsed.typ !== "refresh") throw new Error("INVALID_GRANT");
    return issueTokens(parsed.sid);
  }
  throw new Error("UNSUPPORTED_GRANT_TYPE");
}

function issueTokens(sid: string) {
  const scope = "whatsapp.read whatsapp.write offline_access";
  return {
    access_token: signPayload({ typ: "access", sid, scope, exp: now() + 60 * 60 }),
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: signPayload({ typ: "refresh", sid, scope, exp: now() + 30 * 24 * 60 * 60 }),
    scope,
  };
}

export function verifyAccessToken(token: string): AccessToken {
  const parsed = verifyPayload<AccessToken>(token);
  if (parsed.typ !== "access" || typeof parsed.sid !== "string") throw new Error("INVALID_ACCESS_TOKEN");
  return parsed;
}
