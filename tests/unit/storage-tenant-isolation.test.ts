import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = path.resolve(
  __dirname,
  "../../supabase/migrations/20260908000000_restore_tenant_scoped_storage_policies.sql",
);
const sql = fs.readFileSync(migrationPath, "utf8");

describe("Storage tenant isolation migration", () => {
  it("removes the later broad mutation policies", () => {
    expect(sql).toContain('DROP POLICY IF EXISTS "Authenticated Upload Products & Media"');
    expect(sql).toContain('DROP POLICY IF EXISTS "Authenticated Delete Products & Media"');
    expect(sql).not.toMatch(/CREATE POLICY "Authenticated (?:Upload|Delete) Products & Media"/);
    for (const policy of ["Admin storage insert", "Admin storage update", "Admin storage delete"]) {
      expect(sql).toContain(`DROP POLICY IF EXISTS "${policy}"`);
      expect(sql).not.toContain(`CREATE POLICY "${policy}"`);
    }
  });

  it("requires a canonical tenant path and a tenant permission for every mutation", () => {
    for (const policy of ["staff insert", "staff update", "owner delete"]) {
      const start = sql.indexOf(`CREATE POLICY "P0 product images ${policy}"`);
      expect(start).toBeGreaterThan(-1);
      const nextPolicy = sql.indexOf("CREATE POLICY", start + 14);
      const statement = sql.slice(start, nextPolicy === -1 ? undefined : nextPolicy);

      expect(statement).toContain("bucket_id = 'product-images'");
      expect(statement).toContain("(storage.foldername(name))[1] = 'uploads'");
      expect(statement).toContain("((storage.foldername(name))[2])::uuid");
      expect(statement).toContain("public.has_tenant_permission");
      expect(statement).toContain("(SELECT auth.uid())");
    }
  });

  it("requires USING and WITH CHECK on update to prevent path reassignment", () => {
    const update = sql.slice(
      sql.indexOf('CREATE POLICY "P0 product images staff update"'),
      sql.indexOf('CREATE POLICY "P0 product images owner delete"'),
    );

    expect(update).toContain("USING (");
    expect(update).toContain("WITH CHECK (");
    expect(update.match(/public\.has_tenant_permission/g)).toHaveLength(2);
  });

  it("does not restore SQL listing access for public delivery buckets", () => {
    expect(sql).toContain('DROP POLICY IF EXISTS "Public Storage Read"');
    expect(sql).toContain('DROP POLICY IF EXISTS "Public Storage Read Products & Media"');
    expect(sql).toContain('DROP POLICY IF EXISTS "Public storage select"');
    expect(sql).not.toMatch(/CREATE POLICY "Public Storage Read/);
  });
});
