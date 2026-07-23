import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { resolveTenantId } from "@/lib/saas/tenant-context";

/** Server Fn: Submit a request for product video */
export const requestProductVideo = createServerFn({ method: "POST" })
  .validator((data: { productId: string; productName: string }) => data)
  .handler(async ({ data: { productId, productName } }) => {
    const tenantId = await resolveTenantId(supabase);
    const { data: userData } = await supabase.auth.getUser();

    // 1. Check duplicate request for same product in this tenant
    const { data: existing } = await (supabase.from("product_video_requests" as any) as any)
      .select("id")
      .eq("product_id", productId)
      .eq("tenant_id", tenantId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return {
        ok: true,
        duplicate: true,
        message: "تم تسجيل طلبك المسبق لتوفير فيديو لهذا المنتج بنجاح. سنقوم بإضافته فور تجهيزه ✨",
      };
    }

    // 2. Insert video request
    const { error: insertErr } = await (supabase.from("product_video_requests" as any) as any).insert({
      tenant_id: tenantId,
      product_id: productId,
      product_name: productName,
      customer_id: userData.user?.id || null,
      status: "pending",
    });

    if (insertErr) {
      console.warn("[requestProductVideo] insert warning:", insertErr.message);
    }

    // 3. Create Admin Audit Notification
    await supabase.from("tenant_audit_logs").insert({
      tenant_id: tenantId,
      actor_id: userData.user?.id || null,
      actor_email: userData.user?.email || null,
      action: "video_request",
      details: {
        product_id: productId,
        product_name: productName,
        message: `العميل طلب توفير فيديو للمنتج: ${productName}`,
      } as any,
    });

    return {
      ok: true,
      duplicate: false,
      message: "تم إرسال طلب توفير الفيديو إلى فريق المتجر بنجاح 🎥! سيتم إشعارات عند إضافة الفيديو.",
    };
  });
