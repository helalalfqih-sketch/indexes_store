import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sql = fs.readFileSync(
  path.resolve(__dirname, "../../supabase/migrations/20260908010000_emergency_order_data_rls.sql"),
  "utf8",
);

describe("P0 order data RLS remediation", () => {
  it("drops every confirmed public production policy", () => {
    for (const policy of [
      "Public can view orders",
      "Public can insert orders",
      "Public can view order items",
      "Public can insert order items",
      "Public can view order status history",
      "Public can insert order status history",
    ]) {
      expect(sql).toContain(`DROP POLICY IF EXISTS "${policy}"`);
      expect(sql).not.toContain(`CREATE POLICY "${policy}"`);
    }
  });

  it("revokes all anonymous access and direct order creation", () => {
    expect(sql).toContain("REVOKE ALL ON TABLE public.orders FROM anon, authenticated");
    expect(sql).toContain("REVOKE ALL ON TABLE public.order_items FROM anon, authenticated");
    expect(sql).toContain(
      "REVOKE ALL ON TABLE public.order_status_history FROM anon, authenticated",
    );
    expect(sql).not.toMatch(/GRANT .* ON TABLE public\.(?:orders|order_items).* TO anon/);
    expect(sql).not.toMatch(
      /GRANT INSERT ON TABLE public\.(?:orders|order_items) TO authenticated/,
    );
  });

  it("keeps customer and guest retrieval server-mediated", () => {
    expect(sql).not.toContain('CREATE POLICY "Customers view own orders"');
    expect(sql).not.toContain('CREATE POLICY "Customers view own order items"');
    expect(sql).not.toContain('CREATE POLICY "Customers view own order status history"');
    expect(sql).not.toMatch(/\buser_id\b/);
    expect(sql).not.toMatch(/CREATE POLICY[\s\S]+?FOR SELECT[\s\S]+?USING \(true\)/);
  });

  it("binds staff access to tenant permissions", () => {
    expect(sql.match(/public\.has_tenant_permission/g)).toHaveLength(5);
    expect(sql.match(/'staff'::public\.tenant_role/g)).toHaveLength(5);
  });

  it("limits staff order updates to operational columns", () => {
    expect(sql).toContain(
      "GRANT UPDATE (status, updated_at) ON TABLE public.orders TO authenticated",
    );
    expect(sql).not.toContain("GRANT UPDATE ON TABLE public.orders TO authenticated");
  });

  it("prevents forged or cross-tenant status history rows", () => {
    expect(sql).toContain("changed_by = (SELECT auth.uid())");
    expect(sql).toContain("managed_order.id = order_status_history.order_id");
    expect(sql).toContain("managed_order.tenant_id = order_status_history.tenant_id");
  });
});
