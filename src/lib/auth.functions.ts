// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AppRole, SessionUser } from "./domain/user";

/**
 * Returns the current session user with roles and profile, or throws Unauthorized.
 * Consumed by client hooks; RLS scoped as the caller.
 */
export const getSessionUser = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SessionUser> => {
    const { supabase, userId, claims } = context;

    const [{ data: profile }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    let roles = ((roleRows ?? []) as { role: AppRole }[]).map((r) => r.role);
    const userEmail = ((claims.email as string | undefined) ?? "").toLowerCase();

    // Primary store owner auto-promotion to full Platform Admin
    if (userEmail === "helalalfqih@gmail.com" && !roles.includes("admin")) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
        if (!roles.includes("admin")) roles.push("admin");
      } catch (err) {
        console.warn("[getSessionUser] Auto-admin promotion notice:", err);
      }
    }

    return {
      id: userId,
      email: (claims.email as string | undefined) ?? null,
      profile: (profile as SessionUser["profile"]) ?? null,
      roles,
    };
  });

