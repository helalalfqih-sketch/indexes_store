// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AppRole, SessionUser } from "./domain/user";

/**
 * Phase 0 🔴 — Get current session user with roles and profile.
 * Consumed by client hooks & route guards; RLS scoped.
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
    const userEmail = ((claims?.email as string | undefined) ?? "").toLowerCase();


    return {
      id: userId,
      email: (claims?.email as string | undefined) ?? null,
      profile: (profile as SessionUser["profile"]) ?? null,
      roles,
    };
  });

/**
 * Phase 0 🔴 — Log unauthorized access attempts to audit logs
 */
export const logUnauthorizedAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ path: z.string() }))
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    console.warn(
      `[Phase0_Security] Unauthorized access attempt to path "${data.path}" by user ${userId} (${claims?.email})`,
    );
    return { success: true };
  });
