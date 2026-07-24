import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { resolveTenantId } from "@/lib/saas/tenant-context";
import { checkTenantPermission } from "@/lib/users.functions";
import * as storefrontService from "@/lib/services/storefront.service";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { createLovableGateway } from "@/lib/ai-gateway.server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export interface WhatsAppConfig {
  phoneNumber: string;
  wabaId: string;
  verifyToken: string;
  apiToken: string;
  autoAiProcess: boolean;
  status: "active" | "disconnected" | "pending";
  lastSyncAt: string | null;
  mediaCount: number;
}

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  phoneNumber: "+967771370740",
  wabaId: "waba_indexes_prod_967",
  verifyToken: "indexes_wa_secret_verify_2026",
  apiToken: "",
  autoAiProcess: true,
  status: "active",
  lastSyncAt: new Date().toISOString(),
  mediaCount: 14,
};

const AiSuggestionSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string(),
  price: z.number(),
  tags: z.array(z.string()),
});

export type AiSuggestion = z.infer<typeof AiSuggestionSchema>;

/** Helper to get database client */
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

/** Helper to resolve scope */
async function resolveCmsScope(authSupabase: any, userId: string | null) {
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

/** Server Fn: Fetch WhatsApp Sync Config */
export const getWhatsAppConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as any;
    const authSupabase = ctx?.supabase;
    const userId = ctx?.userId || null;
    const db = await getDbClient(authSupabase);
    const { scope } = await resolveCmsScope(authSupabase, userId);

    const row = await storefrontService.readSettingRow(db, "whatsapp_sync", scope);
    const val = row?.draft_value || row?.value;

    if (!val) return DEFAULT_WHATSAPP_CONFIG;
    return { ...DEFAULT_WHATSAPP_CONFIG, ...(val as Partial<WhatsAppConfig>) };
  });

/** Server Fn: Save WhatsApp Sync Config */
export const saveWhatsAppConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: WhatsAppConfig) => data)
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const hasPerm = await checkTenantPermission("cms", ctx);
    if (!hasPerm) {
      throw new Error("صلاحية مرفوضة: تتطلب صلاحية إدارة التكاملات.");
    }

    const authSupabase = ctx?.supabase;
    const userId = ctx?.userId || null;
    const db = await getDbClient(authSupabase);
    const { scope } = await resolveCmsScope(authSupabase, userId);

    const res = await storefrontService.saveLiveValue(db, "whatsapp_sync", data, scope);
    if (!res.ok) {
      throw new Error(res.message || "فشل حفظ إعدادات الواتساب.");
    }
    return { ok: true };
  });

/** Generate AI Product Draft from Image/Video URL or Base64 */
export async function generateAiProductDraftFromMedia(
  mediaUrl: string,
  hint = ""
): Promise<AiSuggestion> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  let model;
  if (lovableKey) {
    const gateway = createLovableGateway(lovableKey);
    model = gateway("google/gemini-3-flash-preview");
  } else if (geminiKey) {
    const gateway = createOpenAICompatible({
      name: "gemini",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      headers: { Authorization: `Bearer ${geminiKey}` },
    });
    model = gateway("gemini-1.5-flash");
  } else {
    // Fallback Mock suggestion if API keys aren't set in local env
    return {
      title: hint || "منتج واتساب جديد",
      description: "تم استيراد هذا المنتج تلقائياً عبر خدمة WhatsApp Media Sync وجاري تجهيز البيانات الفنية له.",
      category: "الإلكترونيات",
      price: 12500,
      tags: ["واتساب", "جديد", "مستورد"],
    };
  }

  const systemMsg =
    "أنت خبير تجارة إلكترونية في اليمن. حلّل الصورة واقترح اسم منتج رائج باللغة العربية، وصف شامل، تصنيف مناسب، وسعر تقديري بالريال اليمني (YER).";

  const userContent: any[] = [
    { type: "text", text: `اقترح بيانات لهذا المنتج المستورد من الواتساب: ${hint}` },
  ];

  if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
    userContent.push({ type: "image", image: new URL(mediaUrl) });
  } else if (mediaUrl.startsWith("data:image/")) {
    const matches = mediaUrl.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
    if (matches) {
      userContent.push({
        type: "image",
        image: Buffer.from(matches[2], "base64"),
        mimeType: matches[1],
      });
    }
  }

  try {
    const { output } = await generateText({
      model,
      system: systemMsg,
      output: Output.object({ schema: AiSuggestionSchema }),
      messages: [{ role: "user", content: userContent }],
    });
    return output;
  } catch (error) {
    console.warn("AI processing error for WhatsApp media:", error);
    return {
      title: hint || "منتج مستورد من واتساب",
      description: "تم استيراد هذا الوسيط من رسائل الواتساب بنجاح.",
      category: "متنوعات",
      price: 9500,
      tags: ["واتساب"],
    };
  }
}

/** Server Fn: Simulate Receiving a WhatsApp Media Message (for Testing & Admin Control) */
export const simulateWhatsAppMediaReceived = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { fileName: string; fileUrl: string; fileType: "image" | "video"; senderPhone: string; caption?: string }) => data)
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const db = ctx.supabase || supabase;
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    // 1. Generate AI Suggestion
    const aiSuggestion = await generateAiProductDraftFromMedia(data.fileUrl, data.caption || data.fileName);

    // 2. Insert record into media_files
    const metadata = {
      source: "whatsapp",
      sender_phone: data.senderPhone,
      caption: data.caption || "",
      ai_suggestion: aiSuggestion,
      received_at: new Date().toISOString(),
    };

    const payload = {
      tenant_id: tenantId,
      file_name: data.fileName,
      file_path: `whatsapp/${tenantId}/${Date.now()}_${data.fileName}`,
      file_url: data.fileUrl,
      file_type: data.fileType,
      mime_type: data.fileType === "video" ? "video/mp4" : "image/jpeg",
      size_bytes: Math.floor(Math.random() * 2000000) + 500000,
      metadata,
      created_by: ctx.userId || null,
    };

    const { data: record, error } = await db.from("media_files").insert(payload).select("*").single();

    if (error) {
      throw new Error("فشل تسجيل وسيط الواتساب: " + error.message);
    }

    // 3. Update WhatsApp Config Last Sync
    const currentCfg = await storefrontService.readSettingRow(db, "whatsapp_sync", tenantId);
    const cfgVal: WhatsAppConfig = (currentCfg?.value as any) || DEFAULT_WHATSAPP_CONFIG;
    const updatedCfg: WhatsAppConfig = {
      ...cfgVal,
      lastSyncAt: new Date().toISOString(),
      mediaCount: (cfgVal.mediaCount || 0) + 1,
    };
    await storefrontService.saveLiveValue(db, "whatsapp_sync", updatedCfg, tenantId);

    return { ok: true, media: record, aiSuggestion };
  });
