import { beforeEach, describe, expect, it, vi } from "vitest";

const requireWhapiAdmin = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
}));
vi.mock("@/lib/whapi-auth.server", () => ({ requireWhapiAdmin }));

import { Route as AuthorizationMetadataRoute } from "@/routes/[.]well-known.oauth-authorization-server";
import { Route as ProtectedResourceMetadataRoute } from "@/routes/[.]well-known.oauth-protected-resource.api.mcp.whatsapp";
import { Route as ApproveRoute } from "@/routes/api/mcp.oauth.approve";
import { Route as AuthorizeRoute } from "@/routes/api/mcp.oauth.authorize";
import { Route as RegisterRoute } from "@/routes/api/mcp.oauth.register";
import { Route as TokenRoute } from "@/routes/api/mcp.oauth.token";
import { Route as WhatsappMcpRoute } from "@/routes/api/mcp.whatsapp";
import { CHATGPT_CALLBACK, CHATGPT_CLIENT_ID, ISSUER } from "@/lib/mcp/whatsapp-oauth.server";

type Handler = (input: { request: Request }) => Promise<Response>;

function handler(route: unknown, method: string): Handler {
  return (route as { server: { handlers: Record<string, Handler> } }).server.handlers[method];
}

const request = (path: string, init?: RequestInit) => new Request(`${ISSUER}${path}`, init);

describe("WhatsApp MCP routes behind Vercel", () => {
  beforeEach(() => {
    requireWhapiAdmin.mockReset();
    requireWhapiAdmin.mockRejectedValue(new Error("UNAUTHORIZED"));
  });

  it("serves same-origin OAuth discovery without a storefront redirect", async () => {
    const authorization = await handler(
      AuthorizationMetadataRoute,
      "GET",
    )({
      request: request("/.well-known/oauth-authorization-server"),
    });
    expect(authorization.status).toBe(200);
    expect(authorization.headers.get("location")).toBeNull();
    expect(authorization.headers.get("cache-control")).toBe("no-store");
    expect(await authorization.json()).toMatchObject({
      issuer: ISSUER,
      authorization_endpoint: `${ISSUER}/api/mcp/oauth/authorize`,
      token_endpoint: `${ISSUER}/api/mcp/oauth/token`,
      registration_endpoint: `${ISSUER}/api/mcp/oauth/register`,
    });

    const resource = await handler(
      ProtectedResourceMetadataRoute,
      "GET",
    )({
      request: request("/.well-known/oauth-protected-resource/api/mcp/whatsapp"),
    });
    expect(resource.status).toBe(200);
    expect(resource.headers.get("location")).toBeNull();
    expect(resource.headers.get("cache-control")).toBe("no-store");
    expect(await resource.json()).toMatchObject({
      resource: `${ISSUER}/api/mcp/whatsapp`,
      authorization_servers: [ISSUER],
    });
  });

  it("redirects only a validated authorization request to same-origin consent", async () => {
    const query = new URLSearchParams({
      response_type: "code",
      code_challenge_method: "S256",
      code_challenge: "c".repeat(43),
      state: "route-survival-state",
      client_id: CHATGPT_CLIENT_ID,
      redirect_uri: CHATGPT_CALLBACK,
    });
    const valid = await handler(
      AuthorizeRoute,
      "GET",
    )({
      request: request(`/api/mcp/oauth/authorize?${query}`),
    });
    const location = new URL(valid.headers.get("location")!);
    expect(valid.status).toBe(302);
    expect(location.origin).toBe(ISSUER);
    expect(location.pathname).toBe("/mcp-authorize");

    query.set("redirect_uri", "https://example.com/callback");
    const invalid = await handler(
      AuthorizeRoute,
      "GET",
    )({
      request: request(`/api/mcp/oauth/authorize?${query}`),
    });
    expect(invalid.status).toBe(400);
    expect(invalid.headers.get("location")).toBeNull();
    expect(await invalid.json()).toEqual({ error: "invalid_request" });
  });

  it("rejects credential-free MCP requests without redirecting their body", async () => {
    const initialize = JSON.stringify({
      jsonrpc: "2.0",
      id: "credential-free-sentinel",
      method: "initialize",
      params: {},
    });

    for (const incoming of [
      request("/api/mcp/whatsapp"),
      request("/api/mcp/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: initialize,
      }),
    ]) {
      const response = await handler(WhatsappMcpRoute, incoming.method)({ request: incoming });
      expect(response.status).toBe(401);
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("www-authenticate")).toBe(
        `Bearer resource_metadata="${ISSUER}/.well-known/oauth-protected-resource/api/mcp/whatsapp"`,
      );
      expect(await response.json()).toEqual({ error: "unauthorized" });
    }
  });

  it("keeps preflight narrow and on the service host", async () => {
    const response = await handler(
      WhatsappMcpRoute,
      "OPTIONS",
    )({
      request: request("/api/mcp/whatsapp", { method: "OPTIONS" }),
    });
    expect(response.status).toBe(204);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(response.headers.get("access-control-allow-methods")).toBe("POST, OPTIONS");
  });

  it("rejects invalid token, registration and approval requests without issuing a redirect", async () => {
    const token = await handler(
      TokenRoute,
      "POST",
    )({
      request: request("/api/mcp/oauth/token", {
        method: "POST",
        body: new URLSearchParams({ grant_type: "authorization_code" }),
      }),
    });
    expect(token.status).toBe(400);
    expect(token.headers.get("location")).toBeNull();
    expect(await token.json()).toEqual({ error: "invalid_grant" });

    const registration = await handler(
      RegisterRoute,
      "POST",
    )({
      request: request("/api/mcp/oauth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redirect_uris: ["https://example.com/callback"] }),
      }),
    });
    expect(registration.status).toBe(400);
    expect(registration.headers.get("location")).toBeNull();
    expect(await registration.json()).toEqual({ error: "invalid_client_metadata" });

    const approval = await handler(
      ApproveRoute,
      "POST",
    )({
      request: request("/api/mcp/oauth/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }),
    });
    expect(approval.status).toBe(403);
    expect(approval.headers.get("location")).toBeNull();
    expect(await approval.json()).toEqual({ error: "access_denied" });
    expect(requireWhapiAdmin).toHaveBeenCalledOnce();
  });
});
