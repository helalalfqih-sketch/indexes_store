import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveCurrentTenant } from "@/lib/saas/tenant-resolver";
import { checkTenantPermission } from "@/lib/users.functions";

export interface ReviewRow {
  id: string;
  product_id: string;
  product_name: string;
  customer_name: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

function normalizeStatus(
  value: unknown,
  isApproved: boolean,
): ReviewRow["status"] {
  return value === "approved" || value === "rejected" || value === "pending"
    ? value
    : isApproved
      ? "approved"
      : "pending";
}

export const listTenantReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReviewRow[]> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };
    const tenantId = await resolveCurrentTenant(supabase, { userId });

    await checkTenantPermission("products", context);

    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(
        "id, product_id, user_id, rating, content, moderation_status, is_approved, created_at",
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`فشل تحميل التقييمات: ${error.message}`);

    const rows = reviews ?? [];
    const productIds: string[] = Array.from(
      new Set(
        rows
          .map((review: any) => review.product_id)
          .filter((id: unknown): id is string => typeof id === "string" && id.length > 0),
      ),
    );
    const userIds: string[] = Array.from(
      new Set(
        rows
          .map((review: any) => review.user_id)
          .filter((id: unknown): id is string => typeof id === "string" && id.length > 0),
      ),
    );

    const [{ data: products }, profilesResult] = await Promise.all([
      productIds.length > 0
        ? supabase
            .from("products")
            .select("id, name")
            .eq("tenant_id", tenantId)
            .in("id", productIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
      (async () => {
        if (userIds.length === 0) return { data: [] as Array<{ id: string; full_name: string | null }> };
        const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
        return getSupabaseAdmin()
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
      })(),
    ]);

    const productNames = new Map(
      (products ?? []).map((product: any) => [product.id, product.name]),
    );
    const customerNames = new Map(
      (profilesResult.data ?? []).map((profile: any) => [profile.id, profile.full_name]),
    );

    return rows.map((review: any) => ({
      id: review.id,
      product_id: review.product_id,
      product_name: productNames.get(review.product_id) || "منتج غير معروف",
      customer_name: customerNames.get(review.user_id) || "عميل",
      rating: Number(review.rating),
      comment: review.content || "",
      status: normalizeStatus(review.moderation_status, Boolean(review.is_approved)),
      created_at: review.created_at,
    }));
  });

const moderationInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
});

export const moderateReview = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => moderationInput.parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string }> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };
    const tenantId = await resolveCurrentTenant(supabase, { userId });

    const { data: allowed, error: permissionError } = await supabase.rpc(
      "has_tenant_permission",
      {
        _tenant_id: tenantId,
        _user_id: userId,
        _required_role: "manager",
      },
    );
    if (permissionError || !allowed) {
      return { success: false, message: "غير مصرح لك بمراجعة التقييمات" };
    }

    const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
    const adminDb = getSupabaseAdmin();
    const { data: updated, error } = await adminDb
      .from("reviews")
      .update({
        moderation_status: data.status,
        is_approved: data.status === "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("tenant_id", tenantId)
      .select("id")
      .maybeSingle();

    if (error || !updated) {
      return { success: false, message: "فشل تحديث التقييم" };
    }

    await adminDb.from("tenant_audit_logs").insert({
      tenant_id: tenantId,
      actor_id: userId,
      actor_email: (context as any).claims?.email || null,
      action: "review_moderation",
      details: { review_id: data.id, status: data.status },
    });

    return { success: true };
  });

export const deleteReview = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string }> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };
    const tenantId = await resolveCurrentTenant(supabase, { userId });

    const { data: allowed, error: permissionError } = await supabase.rpc(
      "has_tenant_permission",
      {
        _tenant_id: tenantId,
        _user_id: userId,
        _required_role: "manager",
      },
    );
    if (permissionError || !allowed) {
      return { success: false, message: "غير مصرح لك بحذف التقييمات" };
    }

    const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
    const adminDb = getSupabaseAdmin();
    const { data: deleted, error } = await adminDb
      .from("reviews")
      .delete()
      .eq("id", data.id)
      .eq("tenant_id", tenantId)
      .select("id")
      .maybeSingle();

    if (error || !deleted) {
      return { success: false, message: "فشل حذف التقييم" };
    }

    await adminDb.from("tenant_audit_logs").insert({
      tenant_id: tenantId,
      actor_id: userId,
      actor_email: (context as any).claims?.email || null,
      action: "review_delete",
      details: { review_id: data.id },
    });

    return { success: true };
  });
