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
    const { userId, claims } = context as any;
    const userEmail = ((claims?.email as string | undefined) ?? "").toLowerCase();

    // Use service role for the elevated write; we already verified the caller is authenticated.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Primary store owner is ALWAYS allowed to claim admin
    if (userEmail === "helalalfqih@gmail.com") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw error;
      return { granted: true };
    }

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

    return { granted: true };
  });

