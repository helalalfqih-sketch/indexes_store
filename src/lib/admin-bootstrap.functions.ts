import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Grants the current signed-in user the "admin" role IFF no admin exists yet.
 * Safe first-admin bootstrap for a fresh Cloud project.
 * After the first admin is created, this becomes a no-op.
 */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ granted: boolean; reason?: string }> => {
    const { userId } = context as any;

    // Use service role for the elevated write; we already verified the caller is authenticated.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing, error: countErr } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countErr) throw countErr;
    // supabaseAdmin returns count via response; use a second query for safety
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");

    if ((count ?? 0) > 0) {
      return { granted: false, reason: "admin_exists" };
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (error) throw error;

    // Suppress unused 'existing' compiler nit
    void existing;
    return { granted: true };
  });
