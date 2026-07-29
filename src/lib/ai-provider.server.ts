/**
 * Indexes Store — AI Provider Management & Resolver Service
 *
 * Billed Project: smartcontentcreator-d49f2 (Vertex AI Enterprise & Direct Gemini)
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveTenantId } from "@/lib/saas/tenant-context";
import { createLovableGateway } from "@/lib/ai-gateway.server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createVertex } from "@ai-sdk/google-vertex";
function getSafeDb(context?: any) {
  return context?.supabase || supabase;
}

// ──────────────────────────────────────────────────────────────
// Types & Schemas
// ──────────────────────────────────────────────────────────────

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

// Simple key masking for frontend display
export function maskApiKey(key?: string | null): string {
  if (!key) return "";
  if (key.length <= 6) return "••••••";
  return "••••••••••••" + key.slice(-4);
}

// Simple symmetric obfuscation/encryption using base64 & app salt
// Prevents plaintext API keys from sitting raw in database queries
const SECRET_SALT = "indexes-ai-secret-key-salt-2026";

export function encryptApiKey(key?: string | null): string | null {
  if (!key) return null;
  if (key.startsWith("ENC:")) return key; // already encrypted
  if (key.startsWith("••••")) return key; // masked key passed back
  try {
    const combined = `${SECRET_SALT}:${key}`;
    const b64 = Buffer.from(combined, "utf-8").toString("base64");
    return `ENC:${b64}`;
  } catch {
    return key;
  }
}

export function decryptApiKey(encrypted?: string | null): string | null {
  if (!encrypted) return null;
  if (!encrypted.startsWith("ENC:")) return encrypted; // plaintext fallback
  try {
    const b64 = encrypted.slice(4);
    const decoded = Buffer.from(b64, "base64").toString("utf-8");
    if (decoded.startsWith(`${SECRET_SALT}:`)) {
      return decoded.slice(SECRET_SALT.length + 1);
    }
    return decoded;
  } catch {
    return encrypted;
  }
}

export function validateProviderModel(provider: string, rawModelName?: string | null): string {
  const model = (rawModelName || "").trim();

  if (provider === "gemini" || provider === "google" || provider === "vertex") {
    if (!model) return "gemini-2.5-flash";
    return model;
  }

  if (provider === "openrouter") {
    if (!model) return "google/gemini-2.5-flash";
    return model.includes("/") ? model : `google/${model}`;
  }

  return model || "gemini-2.5-flash";
}

export function createModelFromConfig(
  provider: AIProviderType | string,
  apiKey: string | null,
  rawModelName: string,
  baseUrl?: string | null,
) {
  const modelName = validateProviderModel(provider, rawModelName);
  if (provider === "lovable") {
    if (!apiKey) throw new Error("Lovable API Key is required");
    const gateway = createLovableGateway(apiKey);
    return gateway(modelName || "google/gemini-3-flash-preview");
  }

  if (provider === "gemini" || provider === "google") {
    if (!apiKey) throw new Error("Google Gemini API Key is required");
    const google = createGoogleGenerativeAI({
      apiKey,
      ...(baseUrl ? { baseURL: baseUrl } : {}),
    });
    return google(modelName);
  }

  if (provider === "openai") {
    if (!apiKey) throw new Error("OpenAI API Key is required");
    const gateway = createOpenAICompatible({
      name: "openai",
      baseURL: baseUrl || "https://api.openai.com/v1/",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return gateway(modelName);
  }

  if (provider === "openrouter") {
    if (!apiKey) throw new Error("OpenRouter API Key is required");
    const gateway = createOpenAICompatible({
      name: "openrouter",
      baseURL: baseUrl || "https://openrouter.ai/api/v1/",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return gateway(modelName);
  }

  if (provider === "vertex") {
    const raw = apiKey || process.env.VERTEX_PROJECT_ID || process.env.GOOGLE_VERTEX_PROJECT;
    let project = "smartcontentcreator-d49f2";
    let credentials: any = undefined;

    if (raw) {
      if (raw.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.project_id) project = parsed.project_id;
          if (parsed.client_email && parsed.private_key) {
            credentials = {
              client_email: parsed.client_email,
              private_key: parsed.private_key,
            };
          }
        } catch (e) {
          console.warn("[VERTEX_JSON_PARSE_ERROR]", e);
        }
      } else {
        project = raw.trim();
      }
    }

    if (!credentials && process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      try {
        const parsedEnv = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        if (parsedEnv.client_email && parsedEnv.private_key) {
          credentials = {
            client_email: parsedEnv.client_email,
            private_key: parsedEnv.private_key,
          };
        }
      } catch (e) {
        console.warn("[VERTEX_ENV_JSON_PARSE_ERROR]", e);
      }
    }

    const location = process.env.VERTEX_LOCATION || "us-central1";
    console.log(
      `[AI_AGENT] Provider: vertex | Model: ${modelName} | Project: ${project} | Location: ${location}`,
    );

    const vertex = createVertex({
      location,
      project,
      googleAuthOptions: credentials ? { credentials } : undefined,
    });
    return vertex(modelName || "gemini-2.5-flash");
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

// ──────────────────────────────────────────────────────────────
// 1. Core Provider Resolver (Database priority -> Env fallback)
// ──────────────────────────────────────────────────────────────

export async function resolveActiveAIProvider(options?: {
  tenantId?: string | null;
  providerId?: string;
}): Promise<ResolvedAIProvider | null> {
  try {
    const tenantId = options?.tenantId || null;

    // Build query for tenant configs OR global configs (tenant_id IS NULL)
    const db = getSafeDb();
    let query = db
      .from("ai_provider_configs" as any)
      .select("*")
      .eq("enabled", true)
      .order("priority", { ascending: true });

    if (options?.providerId) {
      query = query.eq("id", options.providerId);
    }

    const { data: configs, error } = await query;

    if (!error && configs && configs.length > 0) {
      // Prioritize tenant-specific config if tenantId matches, otherwise global
      const sorted = configs.sort((a: any, b: any) => {
        if (tenantId && a.tenant_id === tenantId && b.tenant_id !== tenantId) return -1;
        if (tenantId && b.tenant_id === tenantId && a.tenant_id !== tenantId) return 1;
        return a.priority - b.priority;
      });

      for (const config of sorted as unknown as AIProviderConfig[]) {
        try {
          const rawKey = decryptApiKey(config.api_key);
          const model = createModelFromConfig(
            config.provider,
            rawKey,
            config.model,
            config.base_url,
          );
          console.log(
            `[AI_PROVIDER_RESOLVED] Using database provider: ${config.provider} (${config.model})`,
          );
          return {
            model,
            provider: config.provider,
            modelName: config.model || "gemini-2.5-flash",
            source: "database",
          };
        } catch (err) {
          console.warn(`[AI_PROVIDER_SKIP] Config ${config.provider} failed init:`, err);
          continue; // try next config
        }
      }
    }
  } catch (dbErr) {
    console.warn("[AI_PROVIDER_DB_ERROR] Falling back to env vars:", dbErr);
  }

  // 2. Fallback to Environment Variables (Vertex AI Billed Project -> Direct Gemini -> Lovable)
  const gcpCredentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const vertexProject = process.env.VERTEX_PROJECT_ID || process.env.GOOGLE_VERTEX_PROJECT;
  const geminiKey = process.env.GEMINI_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;

  // Full JSON service account credentials (Billed Google Cloud Vertex AI - Best priority)
  if (gcpCredentialsJson) {
    try {
      const creds = JSON.parse(gcpCredentialsJson);
      const project = creds.project_id || vertexProject || "smartcontentcreator-d49f2";
      const location = process.env.VERTEX_LOCATION || "us-central1";
      const targetModel = "gemini-2.5-flash";
      const googleAuthOptions =
        creds.client_email && creds.private_key
          ? { credentials: { client_email: creds.client_email, private_key: creds.private_key } }
          : undefined;
      const vertex = createVertex({
        location,
        project,
        googleAuthOptions,
      });
      console.log(
        `[AI_AGENT] Provider: vertex | Model: ${targetModel} | Project: ${project} | Location: ${location}`,
      );
      return {
        model: vertex(targetModel),
        provider: "vertex",
        modelName: targetModel,
        source: "env",
      };
    } catch (e) {
      console.warn("[AI_PROVIDER_ENV] Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:", e);
    }
  }

  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    const targetModel = "gemini-2.5-flash";
    console.log(`[AI_AGENT] Provider: gemini | Model: ${targetModel}`);
    return {
      model: google(targetModel),
      provider: "gemini",
      modelName: targetModel,
      source: "env",
    };
  }

  if (lovableKey) {
    const gateway = createLovableGateway(lovableKey);
    return {
      model: gateway("google/gemini-3-flash-preview"),
      provider: "lovable",
      modelName: "google/gemini-3-flash-preview",
      source: "env",
    };
  }

  if (vertexProject) {
    const location = process.env.VERTEX_LOCATION || "us-central1";
    const targetModel = "gemini-2.5-flash";
    const vertex = createVertex({
      location,
      project: vertexProject,
    });
    console.log(
      `[AI_AGENT] Provider: vertex | Model: ${targetModel} | Project: ${vertexProject} | Location: ${location}`,
    );
    return {
      model: vertex(targetModel),
      provider: "vertex",
      modelName: targetModel,
      source: "env",
    };
  }

  return null;
}

// ──────────────────────────────────────────────────────────────
// 2. Server Functions for Admin UI CRUD & Testing
// ──────────────────────────────────────────────────────────────

export const listAIProvidersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = (context as any).supabase;
    const tenantId = await resolveTenantId(db, { userId: (context as any)?.userId });

    const { data, error } = await db
      .from("ai_provider_configs" as any)
      .select("*")
      .order("priority", { ascending: true });

    if (error) {
      // If table doesn't exist yet, return clean empty list
      if (
        error.code === "42P01" ||
        error.message?.includes("does not exist") ||
        error.message?.includes("schema cache")
      ) {
        return [];
      }
      throw new Error(error.message);
    }

    // Mask keys before returning to frontend
    return (data || []).map((item: any) => ({
      ...item,
      api_key: maskApiKey(decryptApiKey(item.api_key)),
      has_key: Boolean(item.api_key),
    })) as (AIProviderConfig & { has_key: boolean })[];
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
  .validator((d: unknown) => SaveProviderSchema.parse(d))
  .handler(async ({ context, data }) => {
    const modelToSave = validateProviderModel(data.provider, data.model);
    const db = getSafeDb(context);
    const tenantId = data.is_global
      ? null
      : await resolveTenantId(db, { userId: (context as any)?.userId });

    let encryptedKey = null;
    if (data.api_key && !data.api_key.startsWith("••••")) {
      encryptedKey = encryptApiKey(data.api_key);
    }

    if (data.id) {
      // Fetch existing if key wasn't changed
      if (data.api_key?.startsWith("••••")) {
        const { data: existing } = await db
          .from("ai_provider_configs" as any)
          .select("api_key")
          .eq("id", data.id)
          .single();
        if (existing) {
          encryptedKey = (existing as any).api_key;
        }
      }

      const { data: updated, error } = await db
        .from("ai_provider_configs" as any)
        .update({
          provider: data.provider,
          api_key: encryptedKey,
          model: modelToSave,
          enabled: data.enabled,
          priority: data.priority,
          base_url: data.base_url || null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", data.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return updated;
    } else {
      const { data: inserted, error } = await db
        .from("ai_provider_configs" as any)
        .insert({
          tenant_id: tenantId,
          provider: data.provider,
          api_key: encryptedKey,
          model: modelToSave,
          enabled: data.enabled,
          priority: data.priority,
          base_url: data.base_url || null,
        } as any)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return inserted;
    }
  });

export const deleteAIProviderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    const db = getSafeDb(context);
    const { error } = await db
      .from("ai_provider_configs" as any)
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const toggleAIProviderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string(), enabled: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    const db = getSafeDb(context);
    const { error } = await db
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
  .validator((d: unknown) => TestConnectionSchema.parse(d))
  .handler(async ({ context, data }) => {
    try {
      let rawKey = data.api_key || null;

      // If masked or not provided, fetch from DB
      if ((!rawKey || rawKey.startsWith("••••")) && data.id) {
        const db = getSafeDb(context);
        const { data: existing } = await db
          .from("ai_provider_configs" as any)
          .select("api_key")
          .eq("id", data.id)
          .single();
        if (existing) {
          rawKey = decryptApiKey((existing as any).api_key);
        }
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

      let lastErr: any = null;
      for (const mName of modelsToTry) {
        try {
          const model = createModelFromConfig(data.provider, rawKey, mName, data.base_url);
          const { text } = await generateText({
            model,
            prompt: "Respond with ONLY the word OK.",
          });

          return {
            success: true,
            message: `تم الاتصال بنجاح بالمزود (${data.provider}) بالموديل [${mName}]. رد النموذج: ${text.trim() || "OK"}`,
            provider: data.provider,
            model: mName,
          };
        } catch (err: any) {
          lastErr = err;
          // If rate limit / quota / 429 / 404 model not found error, try next fallback model
          if (/quota|rate|429|limit|not found|was not found/i.test(err?.message || "")) {
            console.warn(
              `[AI_TEST_FALLBACK] Model ${mName} failed (${err?.message}), trying next fallback...`,
            );
            continue;
          }
          throw err;
        }
      }
      throw lastErr;
    } catch (err: any) {
      console.error("[AI_TEST_ERROR]", err);
      return {
        success: false,
        error: err?.message || String(err),
      };
    }
  });
