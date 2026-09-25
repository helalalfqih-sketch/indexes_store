/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveTenantId } from "@/lib/saas/tenant-context";
import { checkTenantPermission } from "@/lib/users.functions";

export type AIProviderType = "gemini" | "lovable" | "openai" | "openrouter" | "vertex";

export interface AIProviderConfig {
  id: string;
  tenant_id: string | null;
  provider: AIProviderType;
  api_key: string | null;
  model: string;
  enabled: boolean;
  priority: number;
  base_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResolvedAIProvider {
  model: any;
  provider: AIProviderType | string;
  modelName: string;
  source: "database" | "env";
}

const SECRET_SALT = "indexes-ai-secret-key-salt-2026";

function getSafeDb(context?: any) {
  const db = context?.supabase;
  if (!db) throw new Error("Authenticated Supabase context is unavailable");
  return db;
}

async function getProviderAccess(context: any) {
  const authDb = getSafeDb(context);
  const userId = context?.userId;
  if (!userId) throw new Error("Unauthenticated");

  const { data: adminRole, error: adminRoleError } = await authDb
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (adminRoleError) throw new Error("Unable to verify platform-admin role");
  const isPlatformAdmin = Boolean(adminRole);

  let tenantId: string | null = null;
  if (isPlatformAdmin) {
    try {
      tenantId = await resolveTenantId(authDb, { userId });
    } catch {
      tenantId = null;
    }
  } else {
    const allowed = await checkTenantPermission("settings", context);
    if (!allowed) throw new Error("Insufficient permission to manage AI providers");
    tenantId = await resolveTenantId(authDb, { userId });
  }

  const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
  return {
    authDb,
    adminDb: getSupabaseAdmin(),
    userId,
    tenantId,
    isPlatformAdmin,
  };
}

function assertConfigAccess(
  row: { tenant_id?: string | null } | null,
  access: { tenantId: string | null; isPlatformAdmin: boolean },
) {
  if (!row) throw new Error("AI provider configuration not found");
  if (access.isPlatformAdmin) return;
  if (!access.tenantId || row.tenant_id !== access.tenantId) {
    throw new Error("Forbidden: AI provider configuration belongs to another scope");
  }
}

function maskProviderConfig(item: any) {
  return {
    ...item,
    api_key: maskApiKey(decryptApiKey(item.api_key)),
    has_key: Boolean(item.api_key),
  };
}

export function maskApiKey(key?: string | null): string {
  if (!key) return "";
  if (key.length <= 6) return "••••••";
  return `••••••••••••${key.slice(-4)}`;
}

export function encryptApiKey(key?: string | null): string | null {
  if (!key) return null;
  if (key.startsWith("ENC:") || key.startsWith("••••")) return key;
  return `ENC:${Buffer.from(`${SECRET_SALT}:${key}`, "utf-8").toString("base64")}`;
}

export function decryptApiKey(encrypted?: string | null): string | null {
  if (!encrypted) return null;
  if (!encrypted.startsWith("ENC:")) return encrypted;
  try {
    const decoded = Buffer.from(encrypted.slice(4), "base64").toString("utf-8");
    return decoded.startsWith(`${SECRET_SALT}:`) ? decoded.slice(SECRET_SALT.length + 1) : decoded;
  } catch {
    return encrypted;
  }
}

export function validateProviderModel(provider: string, rawModelName?: string | null): string {
  const model = (rawModelName || "").trim();
  if (provider === "gemini" || provider === "google" || provider === "vertex") {
    return model || "gemini-2.5-flash";
  }
  if (provider === "openrouter") {
    if (!model) return "google/gemini-2.5-flash";
    return model.includes("/") ? model : `google/${model}`;
  }
  return model || "gemini-2.5-flash";
}

export async function createModelFromConfig(
  provider: AIProviderType | string,
  apiKey: string | null,
  rawModelName: string,
  baseUrl?: string | null,
) {
  const runtime = await import("@/lib/ai-provider.runtime.server");
  return runtime.createModelFromConfig(provider, apiKey, rawModelName, baseUrl);
}

export async function resolveActiveAIProvider(options?: {
  tenantId?: string | null;
  providerId?: string;
}): Promise<ResolvedAIProvider | null> {
  const runtime = await import("@/lib/ai-provider.runtime.server");
  return runtime.resolveActiveAIProvider(options);
}

export const listAIProvidersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const access = await getProviderAccess(context);
    let query = access.adminDb
      .from("ai_provider_configs" as any)
      .select("*")
      .order("priority", { ascending: true });

    if (!access.isPlatformAdmin) {
      query = query.or(`tenant_id.eq.${access.tenantId},tenant_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      if (
        error.code === "42P01" ||
        error.message?.includes("does not exist") ||
        error.message?.includes("schema cache")
      ) {
        return [];
      }
      throw new Error(error.message);
    }

    return (data || []).map(maskProviderConfig) as (AIProviderConfig & { has_key: boolean })[];
  });

const SaveProviderSchema = z.object({
  id: z.string().optional(),
  provider: z.enum(["gemini", "lovable", "openai", "openrouter", "vertex"]),
  api_key: z.string().optional().nullable(),
  model: z.string().min(1),
  enabled: z.boolean().default(true),
  priority: z.number().default(100),
  base_url: z.string().optional().nullable(),
  is_global: z.boolean().default(false),
});

export const saveAIProviderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => SaveProviderSchema.parse(input))
  .handler(async ({ context, data }) => {
    const access = await getProviderAccess(context);

    if (data.is_global && !access.isPlatformAdmin) {
      throw new Error("Forbidden: platform admin required for global AI providers");
    }

    const targetTenantId = data.is_global ? null : access.tenantId;
    if (!data.is_global && !targetTenantId) {
      throw new Error("Tenant not resolved for AI provider configuration");
    }

    const model = validateProviderModel(data.provider, data.model);
    let encryptedKey: string | null = null;
    let existing: any = null;

    if (data.id) {
      const existingResult = await access.adminDb
        .from("ai_provider_configs" as any)
        .select("*")
        .eq("id", data.id)
        .maybeSingle();
      if (existingResult.error) throw new Error(existingResult.error.message);
      existing = existingResult.data;
      assertConfigAccess(existing, access);
    }

    if (data.api_key && !data.api_key.startsWith("••••")) {
      encryptedKey = encryptApiKey(data.api_key);
    } else if (existing) {
      encryptedKey = existing.api_key ?? null;
    }

    if (data.id) {
      const { data: updated, error } = await access.adminDb
        .from("ai_provider_configs" as any)
        .update({
          tenant_id: targetTenantId,
          provider: data.provider,
          api_key: encryptedKey,
          model,
          enabled: data.enabled,
          priority: data.priority,
          base_url: data.base_url || null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", data.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return maskProviderConfig(updated);
    }

    const { data: inserted, error } = await access.adminDb
      .from("ai_provider_configs" as any)
      .insert({
        tenant_id: targetTenantId,
        provider: data.provider,
        api_key: encryptedKey,
        model,
        enabled: data.enabled,
        priority: data.priority,
        base_url: data.base_url || null,
      } as any)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return maskProviderConfig(inserted);
  });

export const deleteAIProviderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ context, data }) => {
    const access = await getProviderAccess(context);
    const existing = await access.adminDb
      .from("ai_provider_configs" as any)
      .select("id, tenant_id")
      .eq("id", data.id)
      .maybeSingle();
    if (existing.error) throw new Error(existing.error.message);
    assertConfigAccess(existing.data, access);

    const { error } = await access.adminDb
      .from("ai_provider_configs" as any)
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const toggleAIProviderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string(), enabled: z.boolean() }).parse(input))
  .handler(async ({ context, data }) => {
    const access = await getProviderAccess(context);
    const existing = await access.adminDb
      .from("ai_provider_configs" as any)
      .select("id, tenant_id")
      .eq("id", data.id)
      .maybeSingle();
    if (existing.error) throw new Error(existing.error.message);
    assertConfigAccess(existing.data, access);

    const { error } = await access.adminDb
      .from("ai_provider_configs" as any)
      .update({ enabled: data.enabled, updated_at: new Date().toISOString() } as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

const TestConnectionSchema = z.object({
  id: z.string().optional(),
  provider: z.enum(["gemini", "lovable", "openai", "openrouter", "vertex"]),
  api_key: z.string().optional().nullable(),
  model: z.string().min(1),
  base_url: z.string().optional().nullable(),
});

export const testAIConnectionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => TestConnectionSchema.parse(input))
  .handler(async ({ context, data }) => {
    try {
      const access = await getProviderAccess(context);
      let rawKey = data.api_key || null;

      if ((!rawKey || rawKey.startsWith("••••")) && data.id) {
        const existingResult = await access.adminDb
          .from("ai_provider_configs" as any)
          .select("tenant_id, api_key")
          .eq("id", data.id)
          .maybeSingle();
        if (existingResult.error) throw new Error(existingResult.error.message);
        assertConfigAccess(existingResult.data, access);
        rawKey = decryptApiKey(existingResult.data?.api_key);
      }

      const modelsToTry = Array.from(
        new Set([
          data.model,
          "gemini-1.5-flash",
          "gemini-2.0-flash-001",
          "gemini-1.5-flash-002",
          "gemini-2.0-flash-exp",
          "gemini-1.5-pro",
          "gemini-2.0-flash",
        ]),
      );

      let lastError: unknown;
      for (const modelName of modelsToTry) {
        try {
          const model = await createModelFromConfig(
            data.provider,
            rawKey,
            modelName,
            data.base_url,
          );
          const { text } = await generateText({
            model,
            prompt: "Respond with ONLY the word OK.",
          });
          return {
            success: true,
            message: `تم الاتصال بنجاح بالمزود (${data.provider}) بالموديل [${modelName}]. رد النموذج: ${text.trim() || "OK"}`,
            provider: data.provider,
            model: modelName,
          };
        } catch (error: any) {
          lastError = error;
          if (/quota|rate|429|limit|not found|was not found/i.test(error?.message || "")) {
            continue;
          }
          throw error;
        }
      }

      throw lastError;
    } catch (error: any) {
      console.error("[AI_TEST_ERROR]", error);
      return { success: false, error: error?.message || String(error) };
    }
  });
