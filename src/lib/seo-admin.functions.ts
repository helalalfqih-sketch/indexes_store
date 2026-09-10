import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { resolveTenantId } from "@/lib/saas/tenant-context";
import { checkTenantPermission } from "@/lib/users.functions";
import * as storefrontService from "@/lib/services/storefront.service";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface GlobalSeoConfig {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogTitle?: string;
  ogDescription?: string;
  twitterCard: "summary" | "summary_large_image";
  twitterUsername?: string;
  canonicalBaseUrl?: string;
  sitemapEnabled: boolean;
  robotsEnabled: boolean;
  robotsCustomDirectives?: string;
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  googleVerificationCode?: string;
  bingVerificationCode?: string;
  siteName?: string;
  alternateName?: string;
  // Schema configuration
  schemaOrgName?: string;
  schemaOrgLogo?: string;
  schemaPhone?: string;
  schemaEmail?: string;
  schemaAddressStreet?: string;
  schemaAddressCity?: string;
  schemaPriceRange?: string;
  // LocalBusiness Schema
  schemaBusinessName?: string;
  schemaCountry?: string;
  schemaOpeningHours?: string;
}

export const DEFAULT_SEO_CONFIG: GlobalSeoConfig = {
  metaTitle: "اندكس للتجارة  — المتجر الرقمي | صنعاء",
  metaDescription: "اكتشف أحدث المنتجات والعروض في اندكس ستور — إلكترونيات، أزياء، وأدوات منزلية بتجربة تسوق ثلاثية الأبعاد فريدة في اليمن.",
  ogImage: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/da426993-5f26-4733-b40c-c0f1f8e814c7/id-preview-7d22af97--80f7d5cf-5026-49dd-8137-91bdaa674a1a.lovable.app-1783204904911.png",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogTitle: "",
  ogDescription: "",
  twitterCard: "summary_large_image",
  twitterUsername: "@indexes_store",
  canonicalBaseUrl: "",
  sitemapEnabled: true,
  robotsEnabled: true,
  robotsCustomDirectives: "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /checkout/\nDisallow: /account/\nSitemap: /sitemap.xml",
  googleVerificationCode: "",
  bingVerificationCode: "",
  siteName: "اندكس ستور",
  alternateName: "Indexes Store",
  schemaOrgName: "اندكس ستور",
  schemaPhone: "+967771370740",
  schemaEmail: "support@indexes-store.com",
  schemaAddressStreet: "شارع بينون",
  schemaAddressCity: "صنعاء",
  schemaPriceRange: "$$",
  schemaBusinessName: "اندكس ستور",
  schemaCountry: "اليمن",
  schemaOpeningHours: "يومياً 9:00 ص - 10:00 م",
};

/** Helper to get database client with service-role fallback */
async function getDbClient(authSupabase?: any) {
  let db = authSupabase || supabase;
  if (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      if (supabaseAdmin) db = supabaseAdmin;
    } catch {
      db = authSupabase || supabase;
    }
  }
  return db;
}

/** Helper to resolve CMS Scope (platform admin -> null (global), store owner -> tenantId) */
async function resolveCmsScope(
  authSupabase: any,
  userId: string | null,
): Promise<{ scope: string | null }> {
  if (!userId || !authSupabase) return { scope: null };

  try {
    const { data: isAdmin } = await authSupabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (isAdmin) return { scope: null };

    const tenantId = await resolveTenantId(authSupabase, { userId });
    return { scope: tenantId };
  } catch {
    return { scope: null };
  }
}

/** Server Fn: Fetch SEO Config for current tenant / global */
export const getSeoSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as any;
    const authSupabase = ctx?.supabase;
    const userId = ctx?.userId || null;
    const db = await getDbClient(authSupabase);
    const { scope } = await resolveCmsScope(authSupabase, userId);

    const row = await storefrontService.readSettingRow(db, "seo", scope);
    const val = row?.draft_value || row?.value;

    if (!val) return DEFAULT_SEO_CONFIG;
    return { ...DEFAULT_SEO_CONFIG, ...(val as Partial<GlobalSeoConfig>) };
  });

/** Server Fn: Save SEO Config for current tenant / global */
export const saveSeoSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: GlobalSeoConfig) => data)
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const hasPerm = await checkTenantPermission("cms", ctx);
    if (!hasPerm) {
      throw new Error("صلاحية مرفوضة: تتطلب صلاحية إدارة SEO و CMS.");
    }

    const authSupabase = ctx?.supabase;
    const userId = ctx?.userId || null;
    const db = await getDbClient(authSupabase);
    const { scope } = await resolveCmsScope(authSupabase, userId);

    // Save live value with resolved scope
    let res = await storefrontService.saveLiveValue(db, "seo", data, scope);

    // Synchronize to global scope as well if platform admin to prevent stale row overrides
    if (scope === null) {
      await storefrontService.saveLiveValue(db, "seo", data, null);
    } else if (!res.ok) {
      // Fallback to global scope if tenant save failed
      res = await storefrontService.saveLiveValue(db, "seo", data, null);
    }

    if (!res.ok) {
      throw new Error(res.message || "حدث خطأ أثناء حفظ إعدادات SEO في قاعدة البيانات.");
    }

    // Keep draft_value synchronized too
    await storefrontService.saveDraftValue(db, "seo", data, scope).catch(() => {});

    // Audit and change logs
    try {
      if (authSupabase && userId) {
        await storefrontService.logChange(db, {
          userId,
          userEmail: ctx?.claims?.email || null,
          actionType: "publish",
          key: "seo",
          oldValue: res.oldValue,
          newValue: data,
        });

        await db.from("tenant_audit_logs").insert({
          tenant_id: scope,
          actor_id: userId || null,
          actor_email: ctx?.claims?.email || null,
          action: "seo_update",
          details: { meta_title: data.metaTitle } as any,
        });
      }
    } catch (err) {
      console.warn("Soft failure logging audit for SEO update:", err);
    }

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
    score -= 20;
    warnings.push({ type: "danger", message: "العنوان الرئيسي (Meta Title) مفقود!" });
  } else if (titleLen < 30 || titleLen > 60) {
    score -= 8;
    warnings.push({ type: "warning", message: `طول العنوان (${titleLen} حرف) يفضل أن يكون بين 30 و 60 حرفاً.` });
  } else {
    warnings.push({ type: "success", message: "طول العنوان الرئيسي مثالي للظهور في محركات البحث." });
  }

  // Description length
  const descLen = cfg.metaDescription?.length || 0;
  if (descLen === 0) {
    score -= 20;
    warnings.push({ type: "danger", message: "الوصف (Meta Description) مفقود!" });
  } else if (descLen < 70 || descLen > 160) {
    score -= 8;
    warnings.push({ type: "warning", message: `طول الوصف (${descLen} حرف) يفضل أن يكون بين 70 و 160 حرفاً.` });
  } else {
    warnings.push({ type: "success", message: "طول الوصف مثالي لنتائج البحث." });
  }

  // OG Image
  if (!cfg.ogImage) {
    score -= 10;
    warnings.push({ type: "warning", message: "صورة المشاركة الاجتماعية (OG Image) مفقودة." });
  } else {
    warnings.push({ type: "success", message: "صورة المعاينة الاجتماعية متوفرة." });
  }

  // Sitemap & Robots
  if (!cfg.sitemapEnabled) {
    score -= 10;
    warnings.push({ type: "warning", message: "ملف خريطة الموقع (Sitemap) معطل حالياً." });
  } else {
    warnings.push({ type: "success", message: "خريطة الموقع (Sitemap.xml) مفعلة." });
  }

  if (!cfg.robotsEnabled) {
    score -= 10;
    warnings.push({ type: "warning", message: "ملف تعليمات الروبوت (Robots.txt) معطل." });
  } else {
    warnings.push({ type: "success", message: "ملف Robots.txt مفعل ومضبوط." });
  }

  // Twitter Username
  if (!cfg.twitterUsername) {
    score -= 5;
    warnings.push({ type: "warning", message: "اسم مستخدم تويتر/X غير محدد." });
  } else {
    warnings.push({ type: "success", message: "اسم مستخدم تويتر/X محدد." });
  }

  // Google Verification
  if (!cfg.googleVerificationCode) {
    score -= 5;
    warnings.push({ type: "warning", message: "رمز إثبات ملكية Google غير محدد — يُنصح بربط Search Console." });
  } else {
    warnings.push({ type: "success", message: "رمز إثبات ملكية Google محدد." });
  }

  // Schema Org Name
  if (!cfg.schemaOrgName) {
    score -= 5;
    warnings.push({ type: "warning", message: "اسم المؤسسة في Schema.org غير محدد." });
  } else {
    warnings.push({ type: "success", message: "بيانات Schema.org للمؤسسة مكتملة." });
  }

  // Schema Phone
  if (!cfg.schemaPhone) {
    score -= 5;
    warnings.push({ type: "warning", message: "رقم هاتف خدمة العملاء غير محدد في Schema." });
  } else {
    warnings.push({ type: "success", message: "رقم هاتف خدمة العملاء محدد في Schema." });
  }

  return { score: Math.max(0, score), warnings };
}
