import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// The operator selects one verified account out of band. Unset means disabled.
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ granted: boolean; reason?: string }> => {
    const allowedUser = process.env.INITIAL_ADMIN_USER_ID;
    if (!allowedUser || allowedUser !== context.userId) {
      return { granted: false, reason: "operator_setup_required" };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("bootstrap_first_admin", {
      target_user: context.userId,
    });
    if (error) throw error;
    return data === true ? { granted: true } : { granted: false, reason: "admin_exists" };
  });
