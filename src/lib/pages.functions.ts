import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { resolveTenantId } from "@/lib/saas/tenant-context";
import { checkTenantPermission } from "@/lib/users.functions";

// Reserved slugs that cannot be used by CMS pages
export const RESERVED_SLUGS = new Set([
  "admin",
  "auth",
  "api",
  "cart",
  "checkout",
  "account",
  "store",
  "onboarding",
  "track",
  "offers",
  "search",
  "category",
  "product",
  "pages",
  "index",
  "null",
  "undefined",
  "sitemap",
  "robots",
]);

export interface CmsPageRecord {
  id: string;
  tenant_id: string;
  slug: string;
  title: string;
  content: string;
  is_published: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: string | null;
  canonical_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CmsPageVersionRecord {
  id: string;
  page_id: string;
  tenant_id: string;
  title_snapshot: string;
  content_snapshot: string;
  edited_by?: string | null;
  editor_email?: string | null;
  created_at: string;
}

/** Sanitize HTML string to prevent XSS attacks */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/javascript:[^\s'"]*/gi, "#");
}

/** Format raw title string to valid slug */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Server Fn: List CMS Pages for current tenant */
export const listCmsPages = createServerFn({ method: "GET" }).handler(async () => {
  const tenantId = await resolveTenantId(supabase);
  const { data, error } = await supabase
    .from("cms_pages")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching CMS pages:", error);
    return [];
  }
  return (data as CmsPageRecord[]) || [];
});

/** Server Fn: Get published page by slug for storefront */
export const getPublicCmsPage = createServerFn({ method: "GET" })
  .validator((data: { slug: string }) => data)
  .handler(async ({ data: { slug } }) => {
    const tenantId = await resolveTenantId(supabase);
    const { data, error } = await supabase
      .from("cms_pages")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error || !data) return null;
    return data as CmsPageRecord;
  });

/** Default template pages */
export const DEFAULT_CMS_PAGES = [
  {
    slug: "about-us",
    title: "عن المتجر / من نحن",
    content: "<h2>مرحباً بكم في اندكس ستور</h2><p>نحن المنصة الرائدة للتسوق والتجارة الإلكترونية العصرية في اليمن. نقدم أجود المنتجات بأفضل الأسعار مع توصيل سريع لجميع المحافظات.</p>",
    meta_title: "من نحن — اندكس ستور",
    meta_description: "تعرف على متجر اندكس ستور ورسالتنا في تقديم أفضل تجربة تسوق إلكتروني في اليمن.",
  },
  {
    slug: "privacy-policy",
    title: "سياسة الخصوصية",
    content: "<h2>سياسة الخصوصية وحماية البيانات</h2><p>نحن نلتزم بحماية خصوصيتك وبياناتك الشخصية عند استخدام متجرنا. لن نقوم ببيع أو مشاركة بياناتك مع أي طرف ثالث بدون موافقتك.</p>",
    meta_title: "سياسة الخصوصية — اندكس ستور",
    meta_description: "سياسة الخصوصية وحماية البيانات الشخصية لعملاء اندكس ستور.",
  },
  {
    slug: "terms",
    title: "الشروط والأحكام",
    content: "<h2>شروط واستخدام الخدمة</h2><p>باستخدامك لموقع اندكس ستور، فإنك توافق على الالتزام بالشروط والأحكام الموضحة هنا لضمان تجربة تسوق آمنة وعادلة للجميع.</p>",
    meta_title: "الشروط والأحكام — اندكس ستور",
    meta_description: "الشروط والأحكام المنظمة لاستخدام متجر اندكس ستور وإتمام الشراء.",
  },
  {
    slug: "return-policy",
    title: "سياسة الإرجاع والاستبدال",
    content: "<h2>سياسة الإرجاع والاستبدال</h2><p>يمكنك طلب إرجاع أو استبدال المنتج خلال 7 أيام من تاريخ الاستلام بشرط أن يكون المنتج بحالته الأصلية غير مستخدم في عبوته الأصلية.</p>",
    meta_title: "سياسة الإرجاع والاستبدال — اندكس ستور",
    meta_description: "تعرف على شروط وإجراءات إرجاع واستبدال المنتجات في اندكس ستور.",
  },
  {
    slug: "shipping-policy",
    title: "سياسة الشحن والتوصيل",
    content: "<h2>سياسة الشحن والتوصيل</h2><p>نوفر خدمة التوصيل السريع لجميع المحافظات اليمنية. استغرق التوصيل داخل صنعاء 24-48 ساعة، وللمحافظات الأخرى خلال 2-4 أيام عمل.</p>",
    meta_title: "سياسة الشحن والتوصيل — اندكس ستور",
    meta_description: "تفاصيل مدة وأسعار وتغطية خدمات الشحن والتوصيل لجميع المحافظات.",
  },
  {
    slug: "faq",
    title: "الأسئلة الشائعة",
    content: "<h2>الأسئلة الشائعة</h2><h3>كيف يمكنني الطلب؟</h3><p>يمكنك إضافة المنتجات إلى السلة ثم إتمام الطلب، أو التواصل المباشر مع الدعم عبر الواتساب.</p><h3>ما هي طرق الدفع؟</h3><p>ندعم الدفع عند الاستلام والحوالات المالية المعتمدة.</p>",
    meta_title: "الأسئلة الشائعة — اندكس ستور",
    meta_description: "إجابات على أكثر الأسئلة شائعة حول الطلبات الشحن والدفع في اندكس ستور.",
  },
];

/** Server Fn: Seed default pages if table is empty for current tenant */
export const seedDefaultPages = createServerFn({ method: "POST" }).handler(async () => {
  const tenantId = await resolveTenantId(supabase);

  // Check existing pages
  const { data: existing } = await supabase.from("cms_pages").select("slug").eq("tenant_id", tenantId);
  const existingSlugs = new Set(existing?.map((p) => p.slug) || []);

  const toInsert = DEFAULT_CMS_PAGES.filter((p) => !existingSlugs.has(p.slug)).map((p) => ({
    tenant_id: tenantId,
    slug: p.slug,
    title: p.title,
    content: sanitizeHtml(p.content),
    is_published: true,
    meta_title: p.meta_title,
    meta_description: p.meta_description,
  }));

  if (toInsert.length > 0) {
    await supabase.from("cms_pages").insert(toInsert);
  }
  return { seeded: toInsert.length };
});

/** Server Fn: Save or update CMS Page with revision version snapshot */
export const saveCmsPage = createServerFn({ method: "POST" })
  .validator((data: {
    id?: string;
    slug: string;
    title: string;
    content: string;
    is_published: boolean;
    meta_title?: string;
    meta_description?: string;
    og_image?: string;
    canonical_url?: string;
  }) => data)
  .handler(async ({ data, context }) => {
    const hasPerm = await checkTenantPermission("cms", context);
    if (!hasPerm) {
      throw new Error("صلاحية مرفوضة: تتطلب صلاحية إدارة محتوى (CMS).");
    }

    const tenantId = await resolveTenantId(supabase);
    const cleanSlug = slugify(data.slug);

    if (RESERVED_SLUGS.has(cleanSlug)) {
      throw new Error(`اسم الرابط (Slug) "${cleanSlug}" محجوز ولا يمكن استخدامه.`);
    }

    const cleanContent = sanitizeHtml(data.content);

    const payload = {
      tenant_id: tenantId,
      slug: cleanSlug,
      title: data.title,
      content: cleanContent,
      is_published: data.is_published,
      meta_title: data.meta_title || null,
      meta_description: data.meta_description || null,
      og_image: data.og_image || null,
      canonical_url: data.canonical_url || null,
      updated_at: new Date().toISOString(),
    };

    let pageId = data.id;

    if (pageId) {
      // Update existing
      const { error } = await supabase.from("cms_pages").update(payload).eq("id", pageId).eq("tenant_id", tenantId);
      if (error) throw new Error(error.message);
    } else {
      // Insert new
      const { data: newPage, error } = await supabase.from("cms_pages").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      pageId = newPage.id;
    }

    // Create page revision version
    if (pageId) {
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from("cms_page_versions").insert({
        page_id: pageId,
        tenant_id: tenantId,
        title_snapshot: data.title,
        content_snapshot: cleanContent,
        edited_by: userData.user?.id || null,
        editor_email: userData.user?.email || null,
      });

      // Log audit trail
      await supabase.from("tenant_audit_logs").insert({
        tenant_id: tenantId,
        actor_id: userData.user?.id || null,
        actor_email: userData.user?.email || null,
        action: data.id ? "page_update" : "page_create",
        details: { page_id: pageId, slug: cleanSlug, is_published: data.is_published } as any,
      });
    }

    return { ok: true, pageId };
  });

/** Server Fn: Get version history for a CMS Page */
export const getPageVersions = createServerFn({ method: "GET" })
  .validator((data: { pageId: string }) => data)
  .handler(async ({ data: { pageId } }) => {
    const tenantId = await resolveTenantId(supabase);
    const { data, error } = await supabase
      .from("cms_page_versions")
      .select("*")
      .eq("page_id", pageId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return [];
    return (data as CmsPageVersionRecord[]) || [];
  });

/** Server Fn: Restore a page to a previous version */
export const restorePageVersion = createServerFn({ method: "POST" })
  .validator((data: { versionId: string; pageId: string }) => data)
  .handler(async ({ data: { versionId, pageId }, context }) => {
    const hasPerm = await checkTenantPermission("cms", context);
    if (!hasPerm) {
      throw new Error("صلاحية مرفوضة: تتطلب صلاحية إدارة محتوى (CMS).");
    }

    const tenantId = await resolveTenantId(supabase);
    const { data: version } = await supabase
      .from("cms_page_versions")
      .select("*")
      .eq("id", versionId)
      .eq("tenant_id", tenantId)
      .single();

    if (!version) throw new Error("نسخة الصفحة غير موجودة");

    const { error } = await supabase
      .from("cms_pages")
      .update({
        title: version.title_snapshot,
        content: version.content_snapshot,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pageId)
      .eq("tenant_id", tenantId);

    if (error) throw new Error(error.message);

    return { ok: true };
  });

/** Server Fn: Delete CMS Page */
export const deleteCmsPage = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data: { id }, context }) => {
    const hasPerm = await checkTenantPermission("cms", context);
    if (!hasPerm) {
      throw new Error("صلاحية مرفوضة: تتطلب صلاحية إدارة محتوى (CMS).");
    }

    const tenantId = await resolveTenantId(supabase);
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from("cms_pages").delete().eq("id", id).eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);

    await supabase.from("tenant_audit_logs").insert({
      tenant_id: tenantId,
      actor_id: userData.user?.id || null,
      actor_email: userData.user?.email || null,
      action: "page_delete",
      details: { page_id: id } as any,
    });

    return { ok: true };
  });
