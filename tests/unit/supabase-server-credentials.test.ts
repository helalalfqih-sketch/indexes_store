import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const jwt = (role: string) =>
  `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.fixture`;

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("SUPABASE_URL", "https://fixture.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", undefined);
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_fixture");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_fixture");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Supabase server credentials", () => {
  it.each([undefined, "", "sb_publishable_fixture", jwt("anon"), jwt("authenticated"), "invalid"])(
    "rejects missing or non-privileged server credentials (%s)",
    async (key) => {
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", key);
      const fetch = vi.fn();
      vi.stubGlobal("fetch", fetch);
      const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
      expect(() => getSupabaseAdmin()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it.each(["sb_secret_fixture", jwt("service_role")])(
    "uses explicit server credentials for a local-product lookup",
    async (key) => {
      const fetch = vi.fn().mockResolvedValue(new Response("[]", { status: 200 }));
      vi.stubGlobal("fetch", fetch);
      const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
      // Configuration is read at first use, after module import.
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", key);
      const admin = getSupabaseAdmin();
      expect(getSupabaseAdmin()).toBe(admin);
      const { data, error } = await admin
        .from("products")
        .select("id")
        .eq("tenant_id", "00000000-0000-0000-0000-000000000000")
        .eq("external_id", "fixture-variant")
        .maybeSingle();
      expect(error).toBeNull();
      expect(data).toBeNull();
      const headers = new Headers(fetch.mock.calls[0][1].headers);
      expect(headers.get("apikey")).toBe(key);
      expect(headers.get("authorization")).toBe(
        key.startsWith("sb_secret_") ? null : `Bearer ${key}`,
      );
    },
  );

  it("does not fall back to a hardcoded production project", async () => {
    vi.stubEnv("SUPABASE_URL", undefined);
    vi.stubEnv("VITE_SUPABASE_URL", undefined);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_fixture");
    const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
    expect(() => getSupabaseAdmin()).toThrow(/SUPABASE_URL/);
  });
});
