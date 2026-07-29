/**
 * Task Decomposition Engine — Gen 2 Autonomous Agentic IDE 🧩
 *
 * Dynamically decomposes high-level user prompts into multi-layer engineering steps:
 *   - Extracts target feature domain (e.g. "wishlist", "orders", "products", "whatsapp")
 *   - Dynamically targets real project file paths across 7 architectural layers
 */

export interface DecomposedTaskStep {
  layer: "database" | "repository" | "service" | "api" | "ui" | "testing" | "deployment";
  title: string;
  description: string;
  targetFile?: string;
  requiresApproval: boolean;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface DecomposedTaskPlan {
  objective: string;
  domain: string;
  layersCount: number;
  steps: DecomposedTaskStep[];
  estimatedTimeSeconds: number;
}

/**
 * Extract target domain keyword from user prompt (e.g. "wishlist", "products", "orders")
 */
function extractTargetDomain(prompt: string): string {
  const p = prompt.toLowerCase();

  if (p.includes("wishlist") || p.includes("مفضلة")) return "wishlist";
  if (p.includes("order") || p.includes("طلب")) return "orders";
  if (p.includes("product") || p.includes("منتج")) return "products";
  if (p.includes("category") || p.includes("تصنيف")) return "categories";
  if (p.includes("whatsapp") || p.includes("واتساب")) return "whatsapp";
  if (p.includes("coupon") || p.includes("كوبون")) return "coupons";
  if (p.includes("shipping") || p.includes("شحن")) return "shipping";
  if (p.includes("search") || p.includes("بحث")) return "search";
  if (p.includes("notification") || p.includes("إشعار")) return "notifications";
  if (p.includes("review") || p.includes("تقييم")) return "reviews";

  // Default slug from query
  const words = p
    .replace(/[^a-z0-9\s]/gi, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  return words[0] || "custom_feature";
}

/**
 * Decompose a high-level user prompt into architectural layers with dynamic file targeting
 */
export function decomposeUserRequest(prompt: string): DecomposedTaskPlan {
  const p = prompt.toLowerCase();
  const domain = extractTargetDomain(prompt);
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14);

  const steps: DecomposedTaskStep[] = [];

  const isNewFeature =
    p.includes("أضف") || p.includes("أنشئ") || p.includes("add") || p.includes("create");
  const includesDb =
    p.includes("جدول") ||
    p.includes("database") ||
    p.includes("schema") ||
    p.includes("تخزين") ||
    isNewFeature;

  // Layer 1: Database
  if (includesDb) {
    steps.push({
      layer: "database",
      title: `1. إعداد مخطط قاعدة البيانات وسياسات RLS (${domain})`,
      description: `إنشاء Migration يضمن عزالية البيانات لـ ${domain} وشحنات Multi-Tenant RLS.`,
      targetFile: `supabase/migrations/${timestamp}_create_${domain}_table.sql`,
      requiresApproval: true,
      riskLevel: "medium",
    });
  }

  // Layer 2: Repository
  steps.push({
    layer: "repository",
    title: `2. بناء طبقة الوصول للبيانات (${domain} repository)`,
    description: `تأمين استعلامات ${domain} وعزل استدلال البيانات حسب tenant_id المباشر.`,
    targetFile: `src/lib/${domain}.functions.ts`,
    requiresApproval: false,
    riskLevel: "low",
  });

  // Layer 3: Service
  steps.push({
    layer: "service",
    title: `3. تطبيق منطق العمل والخدمة الخادمية (${domain}.service.ts)`,
    description: `بناء الخدمة الخادمية لمعالجة حالات خطأ ${domain} واستدلال البيانات.`,
    targetFile: `src/services/${domain}.service.ts`,
    requiresApproval: false,
    riskLevel: "low",
  });

  // Layer 4: API
  steps.push({
    layer: "api",
    title: `4. إنشاء Server Functions & API Endpoints لـ ${domain}`,
    description: `ربط الخدمة بـ TanStack Server Functions مع تفعيل الصلاحيات.`,
    targetFile: `src/lib/${domain}.functions.ts`,
    requiresApproval: false,
    riskLevel: "low",
  });

  // Layer 5: UI
  steps.push({
    layer: "ui",
    title: `5. بناء واجهة المستخدم وتكامل المسار (admin.${domain}.tsx)`,
    description: `تطوير مكونات ${domain} باستخدام Tailwind CSS ونظام التصميم Glassmorphism.`,
    targetFile: `src/routes/admin.${domain}.tsx`,
    requiresApproval: true,
    riskLevel: "medium",
  });

  // Layer 6: Testing
  steps.push({
    layer: "testing",
    title: `6. التثبت التلقائي واختبار الأنواع (Typecheck)`,
    description: `تشغيل npm run typecheck لضمان سلامة التجميع والتوافق البرمجي.`,
    requiresApproval: false,
    riskLevel: "low",
  });

  // Layer 7: Deployment
  steps.push({
    layer: "deployment",
    title: `7. النشر المباشر والمصادقة الإنتاجية`,
    description: `تجهيز حزمة الإنتاج للـ ${domain} وتنفيذ النشر المباشر.`,
    requiresApproval: true,
    riskLevel: "high",
  });

  return {
    objective: prompt,
    domain,
    layersCount: steps.length,
    steps,
    estimatedTimeSeconds: steps.length * 15,
  };
}
