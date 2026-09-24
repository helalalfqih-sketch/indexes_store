import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  from: vi.fn(),
  adminFrom: vi.fn(),
  userId: "owner",
  member: { role: "manager", permissions: [] as string[] },
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = {
      middleware: () => builder,
      validator: () => builder,
      inputValidator: () => builder,
      handler: (fn: (args: unknown) => unknown) => (args?: { data: unknown }) =>
        fn({
          data: args?.data,
          context: {
            supabase: { from: m.from },
            userId: m.userId,
            claims: { email: "helalalfqih@gmail.com" },
          },
        }),
    };
    return builder;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({
  getSupabaseAdmin: () => ({ from: m.adminFrom }),
  supabaseAdmin: { from: m.adminFrom },
}));
vi.mock("@/lib/saas/tenant-context", () => ({ resolveTenantId: async () => "tenant-a" }));
import { listTenantMembers } from "@/lib/users.functions";
import { getSessionUser } from "@/lib/auth.functions";
import { completeOnboarding } from "@/lib/onboarding.functions";
beforeEach(() => {
  vi.resetAllMocks();
  m.member = { role: "manager", permissions: [] };
});
it("keeps authorized staff directory scoped to the tenant membership result", async () => {
  const eq = vi.fn();
  const query = {
    select: () => query,
    eq,
    maybeSingle: async () => ({ data: m.member, error: null }),
    order: async () => ({ data: [{ user_id: "staff-a" }], error: null }),
  };
  eq.mockReturnValue(query);
  m.from.mockReturnValue(query);
  const subset = vi
    .fn()
    .mockResolvedValue({ data: [{ id: "staff-a", full_name: "Staff" }], error: null });
  m.adminFrom.mockReturnValue({ select: () => ({ in: subset }) });
  const result = await listTenantMembers();
  expect(eq).toHaveBeenCalledWith("tenant_id", "tenant-a");
  expect(subset).toHaveBeenCalledWith("id", ["staff-a"]);
  expect(result[0].profile?.full_name).toBe("Staff");
  m.member = { role: "viewer", permissions: [] };
  m.adminFrom.mockClear();
  await expect(listTenantMembers()).rejects.toThrow("Insufficient permission");
  expect(m.adminFrom).not.toHaveBeenCalled();
});
it("session reads never elevate a matching email", async () => {
  m.from.mockImplementation((table: string) => {
    const query = {
      select: () => query,
      eq: () =>
        table === "profiles"
          ? { maybeSingle: async () => ({ data: null }) }
          : Promise.resolve({ data: [{ role: "customer" }] }),
    };
    return query;
  });
  expect((await getSessionUser()).roles).toEqual(["customer"]);
  expect(m.adminFrom).not.toHaveBeenCalled();
});
it("onboarding creates only a free plan even when a paid plan is requested", async () => {
  const insert = vi.fn();
  const query = {
    select: () => query,
    eq: () => query,
    limit: () => query,
    maybeSingle: async () => ({ data: null, error: null }),
    insert,
    single: async () => ({ data: { id: "tenant-a" }, error: null }),
    upsert: async () => ({ error: null }),
  };
  insert.mockReturnValue(query);
  m.adminFrom.mockReturnValue(query);
  await completeOnboarding({ data: { slug: "new-store", name: "Store", plan: "enterprise" } });
  expect(insert).toHaveBeenCalledWith(
    expect.objectContaining({ plan: "free", owner_user_id: "owner" }),
  );
});
