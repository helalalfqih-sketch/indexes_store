import { createHash } from "node:crypto";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { verifyStoreAccessToken } from "@/lib/mcp/store-oauth.server";

vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => options }));
const session = vi.hoisted(() => vi.fn());
vi.mock("@/lib/mcp/store-auth.server", () => ({ requireStoreAdminSession: session }));
import { Route as Register } from "@/routes/api/mcp.store.oauth.register";
import { Route as Authorize } from "@/routes/api/mcp.store.oauth.authorize";
import { Route as Approve } from "@/routes/api/mcp.store.oauth.approve";
import { Route as Token } from "@/routes/api/mcp.store.oauth.token";

type Handler = (args: { request: Request }) => Promise<Response>;
const handler = (route: unknown, method: string) =>
  (route as { server: { handlers: Record<string, Handler> } }).server.handlers[method];
const base = "https://indexes-store.vercel.app";
const jsonRequest = (path: string, body: unknown) =>
  new Request(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.stubEnv("STORE_MCP_OAUTH_SECRET", "isolated-test-secret-at-least-thirty-two-characters");
  session.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

it("preserves approved scopes across registration, consent, token exchange and refresh", async () => {
  // Only the admin identity boundary is simulated; all OAuth handlers are real.
  session.mockResolvedValue({ sub: "test-admin", tenantId: "test-tenant" });
  const redirect = "https://chatgpt.com/connector/oauth/test";
  const registration = await handler(
    Register,
    "POST",
  )({ request: jsonRequest("/api/mcp/store/oauth/register", { redirect_uris: [redirect] }) });
  expect(registration.status).toBe(201);
  const client = (await registration.json()).client_id;
  const verifier = "v".repeat(64);
  const params = new URLSearchParams({
    client_id: client,
    redirect_uri: redirect,
    state: "test-state",
    scope: "store.read store.test offline_access",
    response_type: "code",
    code_challenge_method: "S256",
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
  });
  const authorization = await handler(
    Authorize,
    "GET",
  )({ request: new Request(base + "/api/mcp/store/oauth/authorize?" + params) });
  expect(authorization.status).toBe(302);
  const consent = Object.fromEntries(new URL(authorization.headers.get("location")!).searchParams);
  const approval = await handler(
    Approve,
    "POST",
  )({ request: jsonRequest("/api/mcp/store/oauth/approve", consent) });
  expect(approval.status).toBe(200);
  const callback = new URL((await approval.json()).redirect);
  expect(callback.searchParams.get("state")).toBe("test-state");
  const tokenResponse = await handler(
    Token,
    "POST",
  )({
    request: new Request(base + "/api/mcp/store/oauth/token", {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: callback.searchParams.get("code")!,
        client_id: client,
        redirect_uri: redirect,
        code_verifier: verifier,
      }),
    }),
  });
  expect(tokenResponse.status).toBe(200);
  const tokens = await tokenResponse.json();
  expect(tokens.scope).toBe("store.read store.test offline_access");
  expect(verifyStoreAccessToken(tokens.access_token)).toEqual({
    sub: "test-admin",
    tenantId: "test-tenant",
    scopes: ["store.read", "store.test", "offline_access"],
  });
  const refresh = await handler(
    Token,
    "POST",
  )({
    request: new Request(base + "/api/mcp/store/oauth/token", {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokens.refresh_token,
      }),
    }),
  });
  expect(refresh.status).toBe(200);
  expect((await refresh.json()).scope).toBe(tokens.scope);
});

it("does not issue a code when the admin session is rejected", async () => {
  session.mockRejectedValue(new Error("UNAUTHORIZED"));
  const response = await handler(
    Approve,
    "POST",
  )({ request: jsonRequest("/api/mcp/store/oauth/approve", {}) });
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ error: "access_denied" });
});
