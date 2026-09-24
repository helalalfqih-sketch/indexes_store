import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerStoreClient } from "@/lib/mcp/store-oauth.server";

vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => options }));
import { Route } from "@/routes/api/mcp.store.oauth.authorize";

const handler = (
  Route as unknown as {
    server: { handlers: { GET: (input: { request: Request }) => Promise<Response> } };
  }
).server.handlers.GET;
const redirect = "https://chatgpt.com/connector/oauth/store-test";
function request(scope = "store.read store.test") {
  const url = new URL("https://indexes-store.vercel.app/api/mcp/store/oauth/authorize");
  url.search = new URLSearchParams({
    client_id: registerStoreClient([redirect]),
    redirect_uri: redirect,
    state: "test-state",
    code_challenge: "a".repeat(43),
    code_challenge_method: "S256",
    response_type: "code",
    scope,
  }).toString();
  return url;
}
describe("store authorization endpoint", () => {
  beforeEach(() =>
    vi.stubEnv("STORE_MCP_OAUTH_SECRET", "isolated-test-secret-at-least-thirty-two-characters"),
  );
  afterEach(() => vi.unstubAllEnvs());
  it("passes test scope and state into consent", async () => {
    const response = await handler({ request: new Request(request()) });
    expect(response.status).toBe(302);
    const next = new URL(response.headers.get("location")!);
    expect(next.pathname).toBe("/mcp-store-authorize");
    expect(next.searchParams.get("scope")).toBe("store.read store.test");
    expect(next.searchParams.get("state")).toBe("test-state");
  });
  it("rejects unsupported scopes without redirecting", async () => {
    const response = await handler({ request: new Request(request("store.read store.delete")) });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_scope", reason: "unsupported_scope" });
    expect(response.headers.get("location")).toBeNull();
  });
  it("identifies invalid client registration without echoing credentials", async () => {
    const url = request();
    url.searchParams.set("client_id", "invalid-client-secret");
    const response = await handler({ request: new Request(url) });
    expect(await response.json()).toEqual({
      error: "invalid_request",
      reason: "client_registration_invalid",
      registration_issue: "invalid_signature",
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("rejects missing PKCE parameters", async () => {
    const url = request();
    url.searchParams.delete("code_challenge");
    const response = await handler({ request: new Request(url) });
    expect(response.status).toBe(400);
    expect((await response.json()).reason).toBe("authorization_parameters_invalid");
  });
});
