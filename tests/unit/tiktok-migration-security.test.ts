import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = path.resolve(
  __dirname,
  "../../supabase/migrations/20260930183000_tiktok_accounts.sql",
);
const sql = fs.readFileSync(migrationPath, "utf8");

describe("TikTok OAuth migration security", () => {
  it("enables RLS on metadata, secret, and OAuth state tables", () => {
    expect(sql).toContain("ALTER TABLE public.tiktok_accounts ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain(
      "ALTER TABLE public.tiktok_account_secrets ENABLE ROW LEVEL SECURITY",
    );
    expect(sql).toContain("ALTER TABLE public.tiktok_oauth_states ENABLE ROW LEVEL SECURITY");
  });

  it("allows authenticated users to read only tenant-scoped metadata", () => {
    expect(sql).toContain("GRANT SELECT ON public.tiktok_accounts TO authenticated");
    expect(sql).toContain("public.has_tenant_permission");
    expect(sql).not.toMatch(
      /GRANT\s+(?:INSERT|UPDATE|DELETE|ALL|SELECT\s*,\s*INSERT)[^;]*tiktok_accounts[^;]*authenticated/i,
    );
  });

  it("keeps provider secrets inaccessible to anon and authenticated roles", () => {
    expect(sql).toContain(
      "REVOKE ALL ON public.tiktok_account_secrets FROM authenticated",
    );
    expect(sql).toContain("GRANT ALL ON public.tiktok_account_secrets TO service_role");
    expect(sql).not.toMatch(
      /GRANT\s+(?:SELECT|INSERT|UPDATE|DELETE|ALL)[^;]*tiktok_account_secrets[^;]*authenticated/i,
    );
  });

  it("keeps OAuth state records service-role only", () => {
    expect(sql).toContain("REVOKE ALL ON public.tiktok_oauth_states FROM authenticated");
    expect(sql).toContain("GRANT ALL ON public.tiktok_oauth_states TO service_role");
  });
});
