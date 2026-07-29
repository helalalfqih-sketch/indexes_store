/**
 * Agent Permissions — Tool Registry & Permission System
 *
 * Defines which tools require immediate execution vs. user approval.
 * Enforces the Read → Plan → Approval → Execute flow.
 */

// ─────────────────────────────────────────────────
// Permission Levels
// ─────────────────────────────────────────────────

export type PermissionLevel =
  | "read" // مسموح مباشرة — لا يحتاج موافقة
  | "approval_required" // يحتاج موافقة صريحة من المستخدم
  | "admin_only" // محظور على المطورين العاديين
  | "denied"; // محظور تماماً

// ─────────────────────────────────────────────────
// Agent Role → Permission Mapping
// ─────────────────────────────────────────────────

export type AgentRole = "owner" | "admin" | "developer" | "viewer";

// ─────────────────────────────────────────────────
// Tool Definition
// ─────────────────────────────────────────────────

export interface ToolDefinition {
  name: string;
  description: string;
  permission: PermissionLevel;
  /** Arabic label shown in the activity stream */
  label: string;
  /** Whether this tool can mutate files or the database */
  isMutation: boolean;
}

// ─────────────────────────────────────────────────
// Tool Registry
// ─────────────────────────────────────────────────

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  // ── Read Tools (no approval needed) ───────────────────────────
  read_file: {
    name: "read_file",
    description: "يقرأ محتوى ملف كود من المشروع",
    permission: "read",
    label: "📂 قراءة ملف",
    isMutation: false,
  },
  search_code: {
    name: "search_code",
    description: "يبحث في شجرة ملفات المشروع عن نص أو رمز",
    permission: "read",
    label: "🔍 البحث في الكود",
    isMutation: false,
  },
  list_files: {
    name: "list_files",
    description: "يسرد ملفات أو مجلدات في مسار معين",
    permission: "read",
    label: "📁 قائمة الملفات",
    isMutation: false,
  },
  inspect_database: {
    name: "inspect_database",
    description: "يفحص هيكل جدول في Supabase (بدون بيانات حساسة)",
    permission: "read",
    label: "🗄️ فحص قاعدة البيانات",
    isMutation: false,
  },
  inspect_migration: {
    name: "inspect_migration",
    description: "يقرأ ملفات الـ migration الموجودة",
    permission: "read",
    label: "📜 قراءة Migration",
    isMutation: false,
  },

  // ── Mutation Tools (require approval) ─────────────────────────
  edit_file: {
    name: "edit_file",
    description: "يعدل محتوى ملف موجود في المشروع",
    permission: "approval_required",
    label: "✏️ تعديل ملف",
    isMutation: true,
  },
  create_file: {
    name: "create_file",
    description: "ينشئ ملفاً جديداً في المشروع",
    permission: "approval_required",
    label: "🆕 إنشاء ملف",
    isMutation: true,
  },
  delete_file: {
    name: "delete_file",
    description: "يحذف ملفاً من المشروع",
    permission: "approval_required",
    label: "🗑️ حذف ملف",
    isMutation: true,
  },
  run_command: {
    name: "run_command",
    description: "يشغل أمراً في terminal (مثل typecheck أو build)",
    permission: "approval_required",
    label: "⚙️ تشغيل أمر",
    isMutation: false,
  },
  run_migration: {
    name: "run_migration",
    description: "ينفذ migration SQL على Supabase",
    permission: "approval_required",
    label: "🛢️ تشغيل Migration",
    isMutation: true,
  },
  git_commit: {
    name: "git_commit",
    description: "ينشئ commit بعد التحقق من نجاح البناء",
    permission: "approval_required",
    label: "💾 حفظ Commit",
    isMutation: true,
  },
  git_push: {
    name: "git_push",
    description: "يرفع التغييرات إلى GitHub (يُشغل Vercel Deployment)",
    permission: "approval_required",
    label: "🚀 رفع إلى GitHub",
    isMutation: true,
  },
};

// ─────────────────────────────────────────────────
// Permission Resolver
// ─────────────────────────────────────────────────

const ROLE_ALLOWED_MUTATIONS: Record<AgentRole, boolean> = {
  owner: true,
  admin: true,
  developer: false,
  viewer: false,
};

/**
 * Check if a given role can execute a tool.
 * Read tools are always allowed for non-viewers.
 * Mutation tools require both approval_required permission AND role access.
 */
export function canExecuteTool(
  toolName: string,
  role: AgentRole,
): { allowed: boolean; reason?: string; requiresApproval: boolean } {
  const tool = TOOL_REGISTRY[toolName];

  if (!tool) {
    return { allowed: false, reason: `أداة غير معروفة: ${toolName}`, requiresApproval: false };
  }

  if (role === "viewer") {
    return {
      allowed: false,
      reason: "المشاهدون لا يملكون أي صلاحيات تنفيذ",
      requiresApproval: false,
    };
  }

  if (tool.permission === "denied" || tool.permission === "admin_only") {
    return { allowed: false, reason: "هذه الأداة محظورة في الوضع الحالي", requiresApproval: false };
  }

  if (tool.permission === "read") {
    return { allowed: true, requiresApproval: false };
  }

  // approval_required
  if (!ROLE_ALLOWED_MUTATIONS[role]) {
    return {
      allowed: false,
      reason: `دور "${role}" لا يملك صلاحية التعديل`,
      requiresApproval: false,
    };
  }

  return { allowed: true, requiresApproval: true };
}

/**
 * Get all tools available for a given role, split by read/mutation.
 */
export function getAvailableTools(role: AgentRole): {
  readTools: ToolDefinition[];
  mutationTools: ToolDefinition[];
} {
  const all = Object.values(TOOL_REGISTRY);
  const readTools = all.filter((t) => t.permission === "read" && role !== "viewer");
  const mutationTools = ROLE_ALLOWED_MUTATIONS[role]
    ? all.filter((t) => t.permission === "approval_required")
    : [];

  return { readTools, mutationTools };
}
