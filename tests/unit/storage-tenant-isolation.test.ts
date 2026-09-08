import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const migrationPath = path.resolve(
  __dirname,
  "../../supabase/migrations/20260908000000_storage_tenant_isolation.sql",
);
const sql = fs.readFileSync(migrationPath, "utf8");

function policyBody(name: string): string {
  const escaped = name.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
  const match = sql.match(
    new RegExp(
      `CREATE POLICY "${escaped}"[\\s\\S]*?(?=\\n\\n(?:CREATE POLICY|DROP POLICY|--|CREATE OR REPLACE|NOTIFY|COMMIT))`,
    ),
  );
  expect(match, `missing policy ${name}`).not.toBeNull();
  return match?.[0] ?? "";
}

describe("Storage tenant-isolation migration contract", () => {
  it("is forward-only, transactional, and fails closed on schema drift", () => {
    expect(sql).toContain("BEGIN;");
    expect(sql).toContain("SET LOCAL lock_timeout = '5s'");
    expect(sql).toContain("SET LOCAL statement_timeout = '120s'");
    expect(sql).toContain("Storage tenant-isolation migration aborted");
    expect(sql).toContain("COMMIT;");
  });

  it("removes every known bucket-wide mutation policy", () => {
    const broadPolicies = [
      "Allow Storage Insert",
      "Allow Storage Update",
      "Allow Storage Delete",
      "Authenticated Upload Products & Media",
      "Authenticated Delete Products & Media",
      "Authenticated upload media buckets",
      "Authenticated update media buckets",
      "Authenticated delete media buckets",
    ];

    for (const name of broadPolicies) {
      expect(sql).toContain(
        `DROP POLICY IF EXISTS "${name}" ON storage.objects;`,
      );
    }
  });

  it("accepts only the canonical tenant path layouts", () => {
    expect(sql).toContain("WHEN first_segment = 'uploads'");
    expect(sql).toContain("THEN split_part(object_name, '/', 2)");
    expect(sql).toContain("ELSE first_segment");
    expect(sql).toMatch(/candidate !~\* '\^\[0-9a-f\]/);
    expect(sql).toContain("RETURN NULL;");
  });

  it.each([
    ["Authenticated upload tenant media", "FOR INSERT TO authenticated"],
    ["Authenticated update tenant media", "FOR UPDATE TO authenticated"],
    ["Authenticated delete tenant media", "FOR DELETE TO authenticated"],
  ])("requires tenant staff permission for %s", (name, command) => {
    const body = policyBody(name);
    expect(body).toContain(command);
    expect(body).toContain("public.storage_object_tenant_id(name) IS NOT NULL");
    expect(body).toContain("public.has_tenant_permission(");
    expect(body).toContain("'staff'::public.tenant_role");
    expect(body).not.toMatch(/TO\s+(?:PUBLIC|anon)\b/i);
  });

  it("preserves anonymous reads without granting anonymous writes", () => {
    const readPolicy = policyBody("Public read media buckets");
    expect(readPolicy).toContain("FOR SELECT TO anon, authenticated");
    expect(sql).not.toMatch(
      /CREATE POLICY[\s\S]*?FOR (?:INSERT|UPDATE|DELETE)[\s\S]*? TO (?:PUBLIC|anon)\b/i,
    );
  });

  it("restricts product-media writes to staff and rejects cross-tenant links", () => {
    const relationPolicy = policyBody("Tenant staff manage product_media");
    expect(relationPolicy).toContain("FOR ALL TO authenticated");
    expect(relationPolicy).toContain("public.has_tenant_permission(");
    expect(relationPolicy).toContain("'staff'::public.tenant_role");

    expect(sql).toContain("p.tenant_id = NEW.tenant_id");
    expect(sql).toContain("m.tenant_id = NEW.tenant_id");
    expect(sql).toContain("RAISE EXCEPTION 'product_media tenant mismatch'");
    expect(sql).toContain("BEFORE INSERT OR UPDATE OF tenant_id, product_id, media_id");
  });

  it("locks helper execution and security-definer search paths", () => {
    expect(sql).toContain("SET search_path = pg_catalog, public");
    expect(sql).toContain(
      "REVOKE ALL ON FUNCTION public.storage_object_tenant_id(text)\n  FROM PUBLIC, anon;",
    );
    expect(sql).toContain(
      "REVOKE ALL ON FUNCTION public.enforce_product_media_tenant_consistency()\n  FROM PUBLIC, anon, authenticated;",
    );
  });
});
