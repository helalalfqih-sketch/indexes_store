import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  createClient: vi.fn(),
  permission: vi.fn(),
  adminRpc: vi.fn(),
  provider: vi.fn(),
  generate: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: m.createClient }));
vi.mock("@/lib/users.functions", () => ({
  checkTenantPermission: m.permission,
  PermissionDeniedError: class extends Error {},
}));
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (config: unknown) => config }));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = {
      middleware: () => builder,
      handler: (fn: (args: unknown) => unknown) => () =>
        fn({ context: { userId: "operator", claims: { email: "helalalfqih@gmail.com" } } }),
    };
    return builder;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc: m.adminRpc } }));
vi.mock("@/lib/ai-provider.server", () => ({ resolveActiveAIProvider: m.provider }));
vi.mock("ai", () => ({
  generateText: m.generate,
  Output: { object: vi.fn() },
  NoObjectGeneratedError: { isInstance: () => false },
}));
import { authorizeAI, readBoundedJson } from "@/lib/ai-access.server";
import { PermissionDeniedError } from "@/lib/users.functions";
import { claimFirstAdmin } from "@/lib/admin-bootstrap.functions";
import { uniqueCatalogSlug } from "@/lib/catalog-slug";
import { Route } from "@/routes/api/ai.analyze-product";
const analyze = (
  Route as unknown as {
    server: { handlers: { POST: (args: { request: Request }) => Promise<Response> } };
  }
).server.handlers.POST;
const request = (token = "signed.test.token", hint = "product") =>
  new Request("https://store.test", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify({ hint }),
  });
beforeEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv("SUPABASE_URL", "https://db.test");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "public");
  m.getUser.mockResolvedValue({ data: { user: { id: "member" } }, error: null });
  m.rpc.mockResolvedValue({ data: true, error: null });
  m.permission.mockResolvedValue(true);
  m.createClient.mockReturnValue({ auth: { getUser: m.getUser }, rpc: m.rpc });
  m.provider.mockResolvedValue({ model: {} });
  m.generate.mockResolvedValue({ output: { title: "Product" } });
});
describe("paid AI access", () => {
  it("rejects missing, malformed, and unverified bearer before provider access", async () => {
    for (const token of ["", "malformed"])
      expect((await analyze({ request: request(token) })).status).toBe(401);
    m.getUser.mockResolvedValueOnce({ data: { user: null }, error: {} });
    expect((await analyze({ request: request() })).status).toBe(401);
    expect(m.provider).not.toHaveBeenCalled();
    expect(m.generate).not.toHaveBeenCalled();
  });
  it("requires product permission before quota or provider calls", async () => {
    m.permission.mockRejectedValueOnce(new PermissionDeniedError());
    expect((await analyze({ request: request() })).status).toBe(403);
    expect(m.rpc).not.toHaveBeenCalled();
    expect(m.provider).not.toHaveBeenCalled();
  });
  it("preserves verified tenant editors with bounded generation", async () => {
    expect((await analyze({ request: request() })).status).toBe(200);
    expect(m.permission).toHaveBeenCalledWith(
      "products",
      expect.objectContaining({ userId: "member" }),
    );
    expect(m.createClient.mock.calls[0][2].global.headers.Authorization).toBe(
      "Bearer signed.test.token",
    );
    expect(m.generate.mock.calls[0][0]).toMatchObject({ maxOutputTokens: 2048, maxRetries: 0 });
  });
  it("fails closed on authorization errors, quota failure and exhaustion", async () => {
    m.permission.mockRejectedValueOnce(new Error("offline"));
    expect((await authorizeAI(request()))?.status).toBe(503);
    m.rpc.mockResolvedValueOnce({ data: null, error: {} });
    expect((await authorizeAI(request()))?.status).toBe(503);
    m.rpc.mockResolvedValueOnce({ data: false, error: null });
    expect((await authorizeAI(request()))?.status).toBe(429);
  });
  it("bounds input, including a body without Content-Length", async () => {
    expect((await analyze({ request: request(undefined, "x".repeat(4001)) })).status).toBe(400);
    expect(m.provider).not.toHaveBeenCalled();
    await expect(readBoundedJson(request(), 2)).rejects.toThrow("too large");
    expect(await readBoundedJson(request())).toEqual({ hint: "product" });
  });
});
describe("operator bootstrap", () => {
  it("does not trust email or an unconfigured/wrong user ID", async () => {
    expect((await claimFirstAdmin()).granted).toBe(false);
    vi.stubEnv("INITIAL_ADMIN_USER_ID", "other");
    expect((await claimFirstAdmin()).granted).toBe(false);
    expect(m.adminRpc).not.toHaveBeenCalled();
  });
  it("only invokes the atomic grant for the configured identity", async () => {
    vi.stubEnv("INITIAL_ADMIN_USER_ID", "operator");
    m.adminRpc.mockResolvedValueOnce({ data: true, error: null });
    expect((await claimFirstAdmin()).granted).toBe(true);
    expect(m.adminRpc).toHaveBeenCalledWith("bootstrap_first_admin", { target_user: "operator" });
    m.adminRpc.mockResolvedValueOnce({ data: null, error: new Error("offline") });
    await expect(claimFirstAdmin()).rejects.toThrow("offline");
  });
});
it("terminates with unique bounded slugs across suffix digit changes", () => {
  const seen = new Set<string>();
  const slugs = Array.from({ length: 110 }, () => uniqueCatalogSlug("a".repeat(60), seen));
  expect(new Set(slugs).size).toBe(110);
  expect(slugs.every((s) => s.length <= 60)).toBe(true);
  expect(slugs[9]).toBe(`${"a".repeat(57)}-10`);
  expect(uniqueCatalogSlug("short", seen)).toBe("short");
  expect(uniqueCatalogSlug("short", seen)).toBe("short-2");
});
