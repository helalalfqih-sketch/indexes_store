import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sql = fs.readFileSync(
  path.resolve(
    __dirname,
    "../../supabase/migrations/20260909172932_pin_trigger_function_search_path.sql",
  ),
  "utf8",
);

describe("trigger function search paths", () => {
  it.each(["update_storefront_settings_updated_at", "update_ai_agent_tasks_updated_at"])(
    "pins %s to public",
    (name) => {
      expect(sql).toContain(`ALTER FUNCTION public.${name}()`);
      expect(sql).toContain("SET search_path = public;");
    },
  );
});
