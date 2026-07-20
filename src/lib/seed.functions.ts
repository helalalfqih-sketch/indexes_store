// @ts-nocheck
/**
 * Admin server function to trigger the catalog seed.
 * Requires an authenticated admin user. Loads the service-role client
 * inside the handler (never at module scope — client-import graph safety).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { seedCatalog } from "@/lib/seed/seed-catalog";

export const runCatalogSeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ force: z.boolean().default(false) }).parse(raw ?? {}))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw error;
    if (!isAdmin) throw new Error("Forbidden: admin required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return seedCatalog(supabaseAdmin, { force: data.force });
  });
