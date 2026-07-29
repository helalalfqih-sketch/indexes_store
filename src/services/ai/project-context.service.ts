/**
 * Project Context Engine Service
 *
 * Provides permanent memory for Indexes Store architecture, frameworks, database schema,
 * rules, and instructions. Supports full Multi-Tenant isolation with Supabase RLS.
 */
import { getAdminDb } from "@/lib/ai-agent.functions";

export interface ProjectContextData {
  id?: string;
  tenant_id: string;
  project_name: string;
  architecture: Record<string, any>;
  frameworks: Record<string, any>;
  database_schema: Record<string, any>;
  important_rules: string[];
  technical_notes?: string | null;
  file_structure: Record<string, any>;
  ai_instructions?: string | null;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_PROJECT_CONTEXT: Omit<ProjectContextData, "tenant_id"> = {
  project_name: "Indexes Store",
  architecture: {
    type: "Multi-Tenant SaaS E-commerce Platform",
    pattern: "Clean Architecture + Server Functions + RLS",
    tenant_isolation: "Strict tenant_id filtering on all tables",
    storage_bucket: "product-images",
  },
  frameworks: {
    frontend: "TanStack Start + React 19 + TypeScript + TailwindCSS 4 + Shadcn UI + Framer Motion",
    backend: "Supabase PostgreSQL + RLS + Server Functions (createServerFn + requireSupabaseAuth)",
    ai: "Google Vertex AI (Enterprise Project: smartcontentcreator-d49f2) + Gemini Models + Vercel AI SDK",
    integrations: [
      "WhatsApp Business API",
      "Meta Commerce Catalog",
      "Google Merchant",
      "Sitemap",
      "JSON-LD",
    ],
  },
  database_schema: {
    tables: [
      "products (id, slug, name, price, stock, category_id, tenant_id)",
      "categories (id, slug, name, parent_id, tenant_id)",
      "orders (id, status, total, customer_email, tenant_id)",
      "order_items (id, order_id, product_id, quantity, price)",
      "media_files (id, file_url, file_path, source, sequence_number, tenant_id)",
      "ai_agent_sessions (id, title, status, task_id, task_status, tenant_id)",
      "ai_agent_messages (id, session_id, role, content, tenant_id)",
      "ai_project_context (id, tenant_id, project_name, architecture, frameworks, database_schema, version)",
    ],
  },
  important_rules: [
    "لا تغير التصميم الحالي للوحة التحكم أو الهوية البصرية بدون طلب صريح",
    "استخدم Server Functions المعرفة بنمط createServerFn + requireSupabaseAuth",
    "حافظ على عزل بيانات المتجر Multi-Tenant isolation بفلتر tenant_id صريح في كل الاستعلامات",
    "حافظ على توافق RTL في واجهات المستخدم العربية",
    "لا تحذف الملفات والمكونات الموجودة بدون خطة موافقة معتمدة",
    "استخدم Tailwind Tokens و Design Tokens المعتمدة بالمشروع",
  ],
  technical_notes:
    "منصة تجارية متكاملة تدعم المتاجر المزدوجة، الربط المباشر مع الواتساب لتنزيل ومزامنة وسائط المنتجات، والمساعد الذكي المستند على Vertex AI.",
  file_structure: {
    routes: [
      "src/routes/index.tsx (الصفحة الرئيسية)",
      "src/routes/search.tsx (صفحة البحث)",
      "src/routes/product.$slug.tsx (صفحة المنتج)",
      "src/routes/admin.ai-developer.tsx (لوحة AI Developer)",
      "src/routes/admin.ai-settings.tsx (إعدادات AI Providers)",
      "src/routes/api/ai.agent.ts (Streaming AI Endpoint)",
    ],
    services: [
      "src/lib/ai-provider.server.ts (موزع AI Providers + Vertex AI)",
      "src/lib/ai-agent.functions.ts (جلسات وذاكرة AI)",
      "src/services/ai/project-context.service.ts (Project Context Engine)",
    ],
  },
  ai_instructions:
    "أنت مهندس برمجيات Senior لـ Indexes Store. أجب دائماً بالعربية التقنية الواضحة وقم بتزويد المستخدم بخطوات دقيقة وكود محدد المجموعات.",
  version: 1,
};

/** Get or initialize Project Context for a tenant */
export async function getProjectContext(tenantId: string = "default"): Promise<ProjectContextData> {
  try {
    const db = await getAdminDb({});
    const { data, error } = await db
      .from("ai_project_context")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (error || !data) {
      // Seed default context if not exists in DB yet
      return seedDefaultProjectContext(tenantId);
    }

    return data as unknown as ProjectContextData;
  } catch (e) {
    console.warn("[ProjectContext] DB fetch fallback:", e);
    return {
      tenant_id: tenantId,
      ...DEFAULT_PROJECT_CONTEXT,
    };
  }
}

/** Seed default project context for a tenant */
export async function seedDefaultProjectContext(
  tenantId: string = "default",
): Promise<ProjectContextData> {
  const initialContext: ProjectContextData = {
    tenant_id: tenantId,
    ...DEFAULT_PROJECT_CONTEXT,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const db = await getAdminDb({});
    const { data, error } = await db
      .from("ai_project_context")
      .upsert(
        {
          tenant_id: tenantId,
          project_name: initialContext.project_name,
          architecture: initialContext.architecture as any,
          frameworks: initialContext.frameworks as any,
          database_schema: initialContext.database_schema as any,
          important_rules: initialContext.important_rules,
          technical_notes: initialContext.technical_notes,
          file_structure: initialContext.file_structure as any,
          ai_instructions: initialContext.ai_instructions,
          version: 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id" },
      )
      .select()
      .maybeSingle();

    if (error || !data) {
      return initialContext;
    }

    return data as unknown as ProjectContextData;
  } catch {
    return initialContext;
  }
}

/** Update project context data for a tenant */
export async function updateProjectContext(
  tenantId: string,
  updates: Partial<Omit<ProjectContextData, "id" | "tenant_id">>,
): Promise<ProjectContextData> {
  const current = await getProjectContext(tenantId);
  const updatedData: ProjectContextData = {
    ...current,
    ...updates,
    version: (current.version || 1) + 1,
    updated_at: new Date().toISOString(),
  };

  try {
    const db = await getAdminDb({});
    const { data } = await db
      .from("ai_project_context")
      .upsert(
        {
          tenant_id: tenantId,
          project_name: updatedData.project_name,
          architecture: updatedData.architecture as any,
          frameworks: updatedData.frameworks as any,
          database_schema: updatedData.database_schema as any,
          important_rules: updatedData.important_rules,
          technical_notes: updatedData.technical_notes,
          file_structure: updatedData.file_structure as any,
          ai_instructions: updatedData.ai_instructions,
          version: updatedData.version,
          updated_at: updatedData.updated_at,
        },
        { onConflict: "tenant_id" },
      )
      .select()
      .maybeSingle();

    return (data as unknown as ProjectContextData) || updatedData;
  } catch {
    return updatedData;
  }
}

/** Build formatted System Prompt context string for AI requests */
export async function buildProjectPromptContext(tenantId: string = "default"): Promise<string> {
  const ctx = await getProjectContext(tenantId);

  const archStr = JSON.stringify(ctx.architecture, null, 2);
  const frameworkStr = JSON.stringify(ctx.frameworks, null, 2);
  const dbStr = JSON.stringify(ctx.database_schema, null, 2);
  const rulesStr = ctx.important_rules.map((r, i) => `${i + 1}. ${r}`).join("\n");
  const fileStr = JSON.stringify(ctx.file_structure, null, 2);

  return `
SYSTEM CONTEXT (PROJECT MEMORY):

Project:
${ctx.project_name}

Architecture:
${archStr}

Frameworks & Stack:
${frameworkStr}

Important Engineering Rules:
${rulesStr}

Database Schema Summary:
${dbStr}

Key File Structure:
${fileStr}

Technical Notes:
${ctx.technical_notes || "N/A"}

Special Instructions:
${ctx.ai_instructions || "N/A"}
`.trim();
}
