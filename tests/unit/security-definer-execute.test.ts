import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sql = fs.readFileSync(
  path.resolve(
    __dirname,
    "../../supabase/migrations/20260909170650_restrict_security_definer_execute.sql",
  ),
  "utf8",
);

const serverOnly = [
  "apply_inventory_movement()",
  "attach_tenant_owner()",
  "create_notification(uuid, uuid, public.notification_type, text, text, jsonb, text, text)",
  "get_best_sellers(uuid, integer, integer)",
  "get_whatsapp_tenant_by_phone(text)",
  "insert_media_file(uuid, text, text, text, text, text, bigint, text, jsonb)",
  "record_sale(uuid, uuid, uuid, integer, numeric, numeric, uuid)",
  "record_webhook_event(uuid, text, text)",
  "update_webhook_event_status(uuid, text, text, text)",
];

describe("SECURITY DEFINER execute grants", () => {
  it.each(serverOnly)("keeps %s server-only", (signature) => {
    expect(sql).toContain(
      `REVOKE ALL ON FUNCTION public.${signature} FROM PUBLIC, anon, authenticated;`,
    );
    expect(sql).toContain(`GRANT EXECUTE ON FUNCTION public.${signature} TO service_role;`);
  });

  it("removes every anonymous and inherited public grant", () => {
    expect(sql).not.toMatch(/GRANT EXECUTE[^;]+TO[^;]*\banon\b/);
    expect(sql).not.toMatch(/GRANT EXECUTE[^;]+TO[^;]*\bPUBLIC\b/);
  });

  it("keeps authorization helpers authenticated", () => {
    for (const signature of [
      "can_manage_tenant(uuid, uuid)",
      "has_role(uuid, public.app_role)",
      "has_tenant_permission(uuid, uuid, public.tenant_role)",
      "has_tenant_role(uuid, uuid, public.tenant_role)",
      "is_tenant_member(uuid, uuid)",
    ]) {
      expect(sql).toContain(
        `GRANT EXECUTE ON FUNCTION public.${signature} TO authenticated, service_role;`,
      );
    }
  });
});
