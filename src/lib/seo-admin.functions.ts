import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { resolveTenantId } from "@/lib/saas/tenant-context";
import { checkTenantPermission } from "@/lib/users.functions";

export interface GlobalSeoConfig {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  twitterCard: "summary" | "summary_large_image";
  canonicalBaseUrl?: string;
  sitemapEnabled: boolean;
  robotsEnabled: boolean;
  robotsCustomDirectives?: string;
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  // Schema configuration
  schemaOrgName?: string;
  schemaOrgLogo?: string;
  schemaPhone?: string;
  schemaEmail?: string;
  schemaAddressStreet?: string;
  schemaAddressCity?: string;
  schemaPriceRange?: string;
}

export const DEFAULT_SEO_CONFIG: GlobalSeoConfig = {
  metaTitle: "اندكس ستور — المتجر الرقمي | تسوّق أونلاين في اليمن",
  metaDescription: "اكتشف أحدث المنتجات والعروض في اندكس ستور — إلكترونيات، أزياء، وأدوات منزلية بتجربة تسوق ثلاثية الأبعاد فريدة في اليمن.",
  ogImage: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/da426993-5f26-4733-b40c-c0f1f8e814c7/id-preview-7d22af97--80f7d5cf-5026-49dd-8137-91bdaa674a1a.lovable.app-1783204904911.png",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: "summary_large_image",
  canonicalBaseUrl: "",
  sitemapEnabled: true,
  robotsEnabled: true,
  robotsCustomDirectives: "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /checkout/\nDisallow: /account/\nSitemap: /sitemap.xml",
  schemaOrgName: "اندكس ستور",
  schemaPhone: "+967770000000",
  schemaEmail: "support@indexes-store.com",
  schemaAddressStreet: "شارع بينون",
  schemaAddressCity: "صنعاء",
  schemaPriceRange: "$$",
};

/** Server Fn: Fetch SEO Config for current tenant */
export const getSeoSettings = createServerFn({ method: "GET" }).handler(async () => {
  const tenantId = await resolveTenantId(supabase);
  const { data } = await supabase
    .from("storefront_settings")
    .select("value")
    .eq("key", "seo")
    .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
    .order("tenant_id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data || !data.value) return DEFAULT_SEO_CONFIG;
  return { ...DEFAULT_SEO_CONFIG, ...(data.value as Partial<GlobalSeoConfig>) };
});

/** Server Fn: Save SEO Config for current tenant */
export const saveSeoSettings = createServerFn({ method: "POST" })
  .validator((data: GlobalSeoConfig) => data)
  .handler(async ({ data, context }) => {
    const hasPerm = await checkTenantPermission("cms", context);
    if (!hasPerm) {
      throw new Error("صلاحية مرفوضة: تتطلب صلاحية إدارة SEO و CMS.");
    }


    const tenantId = await resolveTenantId(supabase);
    const { data: userData } = await supabase.auth.getUser();

    // Check existing row
    const { data: existing } = await supabase
      .from("storefront_settings")
      .select("id")
      .eq("key", "seo")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (existing) {
      await supabase.from("storefront_settings").update({ value: data as any, updated_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await supabase.from("storefront_settings").insert({ key: "seo", tenant_id: tenantId, value: data as any, type: "json" });
    }

    // Audit log
    await supabase.from("tenant_audit_logs").insert({
      tenant_id: tenantId,
      actor_id: userData.user?.id || null,
      actor_email: userData.user?.email || null,
      action: "seo_update",
      details: { meta_title: data.metaTitle } as any,
    });

    return { ok: true };
  });

export interface SeoAuditReport {
  score: number; // 0 - 100
  warnings: Array<{ type: "danger" | "warning" | "success"; message: string }>;
}

/** Evaluate SEO health report based on configuration */
export function evaluateSeoHealth(cfg: GlobalSeoConfig): SeoAuditReport {
  const warnings: Array<{ type: "danger" | "warning" | "success"; message: string }> = [];
  let score = 100;

  // Title length
  const titleLen = cfg.metaTitle?.length || 0;
  if (titleLen === 0) {
    score -= 25;
    warnings.push({ type: "danger", message: "العنوان الرئيسي (Meta Title) مفقود!" });
  } else if (titleLen < 30 || titleLen > 60) {
    score -= 10;
    warnings.push({ type: "warning", message: `طول العنوان (${titleLen} حرف) يفضل أن يكون بين 30 و 60 حرفاً.` });
  } else {
    warnings.push({ type: "success", message: "طول العنوان الرئيسي مثالي للظهور في محركات البحث." });
  }

  // Description length
  const descLen = cfg.metaDescription?.length || 0;
  if (descLen === 0) {
    score -= 25;
    warnings.push({ type: "danger", message: "الوصف (Meta Description) مفقود!" });
  } else if (descLen < 70 || descLen > 160) {
    score -= 10;
    warnings.push({ type: "warning", message: `طول الوصف (${descLen} حرف) يفضل أن يكون بين 70 و 160 حرفاً.` });
  } else {
    warnings.push({ type: "success", message: "طول الوصف مثالي لنتائج البحث." });
  }

  // OG Image
  if (!cfg.ogImage) {
    score -= 15;
    warnings.push({ type: "warning", message: "صورة المشاركة الاجتماعية (OG Image) مفقودة." });
  } else {
    warnings.push({ type: "success", message: "صورة المعاينة الاجتماعية متوفرة." });
  }

  // Sitemap & Robots
  if (!cfg.sitemapEnabled) {
    score -= 15;
    warnings.push({ type: "warning", message: "ملف خريطة الموقع (Sitemap) معطل حالياً." });
  } else {
    warnings.push({ type: "success", message: "خريطة الموقع (Sitemap.xml) مفعلة." });
  }

  if (!cfg.robotsEnabled) {
    score -= 15;
    warnings.push({ type: "warning", message: "ملف تعليمات الروبوت (Robots.txt) معطل." });
  } else {
    warnings.push({ type: "success", message: "ملف Robots.txt مفعل ومضبوط." });
  }

  return { score: Math.max(0, score), warnings };
}
