import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createVertex } from "@ai-sdk/google-vertex";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createLovableGateway } from "@/lib/ai-gateway.server";
import { supabase } from "@/integrations/supabase/client";

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

export function decryptApiKey(encrypted?: string | null): string | null {
  if (!encrypted) return null;
  if (!encrypted.startsWith("ENC:")) return encrypted;
  try {
    const decoded = Buffer.from(encrypted.slice(4), "base64").toString("utf-8");
    return decoded.startsWith(`${SECRET_SALT}:`)
      ? decoded.slice(SECRET_SALT.length + 1)
      : decoded;
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

export function createModelFromConfig(
  provider: AIProviderType | string,
  apiKey: string | null,
  rawModelName: string,
  baseUrl?: string | null,
) {
  const modelName = validateProviderModel(provider, rawModelName);

  if (provider === "lovable") {
    if (!apiKey) throw new Error("Lovable API Key is required");
    return createLovableGateway(apiKey)(modelName || "google/gemini-3-flash-preview");
  }

  if (provider === "gemini" || provider === "google") {
    if (!apiKey) throw new Error("Google Gemini API Key is required");
    return createGoogleGenerativeAI({
      apiKey,
      ...(baseUrl ? { baseURL: baseUrl } : {}),
    })(modelName);
  }

  if (provider === "openai") {
    if (!apiKey) throw new Error("OpenAI API Key is required");
    return createOpenAICompatible({
      name: "openai",
      baseURL: baseUrl || "https://api.openai.com/v1/",
      headers: { Authorization: `Bearer ${apiKey}` },
    })(modelName);
  }

  if (provider === "openrouter") {
    if (!apiKey) throw new Error("OpenRouter API Key is required");
    return createOpenAICompatible({
      name: "openrouter",
      baseURL: baseUrl || "https://openrouter.ai/api/v1/",
      headers: { Authorization: `Bearer ${apiKey}` },
    })(modelName);
  }

  if (provider === "vertex") {
    const raw = apiKey || process.env.VERTEX_PROJECT_ID || process.env.GOOGLE_VERTEX_PROJECT;
    let project = "smartcontentcreator-d49f2";
    let credentials: { client_email: string; private_key: string } | undefined;

    if (raw?.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(raw);
        project = parsed.project_id || project;
        if (parsed.client_email && parsed.private_key) {
          credentials = {
            client_email: parsed.client_email,
            private_key: parsed.private_key,
          };
        }
      } catch (error) {
        console.warn("[VERTEX_JSON_PARSE_ERROR]", error);
      }
    } else if (raw) {
      project = raw.trim();
    }

    if (!credentials && process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      try {
        const parsed = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        if (parsed.client_email && parsed.private_key) {
          credentials = {
            client_email: parsed.client_email,
            private_key: parsed.private_key,
          };
          project = parsed.project_id || project;
        }
      } catch (error) {
        console.warn("[VERTEX_ENV_JSON_PARSE_ERROR]", error);
      }
    }

    const location = process.env.VERTEX_LOCATION || "us-central1";
    return createVertex({
      location,
      project,
      googleAuthOptions: credentials ? { credentials } : undefined,
    })(modelName || "gemini-2.5-flash");
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

export async function resolveActiveAIProvider(options?: {
  tenantId?: string | null;
  providerId?: string;
}): Promise<ResolvedAIProvider | null> {
  try {
    let query = supabase
      .from("ai_provider_configs" as any)
      .select("*")
      .eq("enabled", true)
      .order("priority", { ascending: true });

    if (options?.providerId) query = query.eq("id", options.providerId);

    const { data: configs, error } = await query;
    if (!error && configs?.length) {
      const tenantId = options?.tenantId || null;
      const sorted = [...configs].sort((a: any, b: any) => {
        if (tenantId && a.tenant_id === tenantId && b.tenant_id !== tenantId) return -1;
        if (tenantId && b.tenant_id === tenantId && a.tenant_id !== tenantId) return 1;
        return a.priority - b.priority;
      });

      for (const config of sorted as unknown as AIProviderConfig[]) {
        try {
          return {
            model: createModelFromConfig(
              config.provider,
              decryptApiKey(config.api_key),
              config.model,
              config.base_url,
            ),
            provider: config.provider,
            modelName: config.model || "gemini-2.5-flash",
            source: "database",
          };
        } catch (error) {
          console.warn(`[AI_PROVIDER_SKIP] ${config.provider}`, error);
        }
      }
    }
  } catch (error) {
    console.warn("[AI_PROVIDER_DB_ERROR] Falling back to env vars:", error);
  }

  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const vertexProject = process.env.VERTEX_PROJECT_ID || process.env.GOOGLE_VERTEX_PROJECT;
  const geminiKey = process.env.GEMINI_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;

  if (credentialsJson) {
    try {
      const credentials = JSON.parse(credentialsJson);
      const modelName = "gemini-2.5-flash";
      return {
        model: createVertex({
          location: process.env.VERTEX_LOCATION || "us-central1",
          project: credentials.project_id || vertexProject || "smartcontentcreator-d49f2",
          googleAuthOptions:
            credentials.client_email && credentials.private_key
              ? {
                  credentials: {
                    client_email: credentials.client_email,
                    private_key: credentials.private_key,
                  },
                }
              : undefined,
        })(modelName),
        provider: "vertex",
        modelName,
        source: "env",
      };
    } catch (error) {
      console.warn("[AI_PROVIDER_ENV] Invalid credentials JSON", error);
    }
  }

  if (geminiKey) {
    const modelName = "gemini-2.5-flash";
    return {
      model: createGoogleGenerativeAI({ apiKey: geminiKey })(modelName),
      provider: "gemini",
      modelName,
      source: "env",
    };
  }

  if (lovableKey) {
    const modelName = "google/gemini-3-flash-preview";
    return {
      model: createLovableGateway(lovableKey)(modelName),
      provider: "lovable",
      modelName,
      source: "env",
    };
  }

  if (vertexProject) {
    const modelName = "gemini-2.5-flash";
    return {
      model: createVertex({
        location: process.env.VERTEX_LOCATION || "us-central1",
        project: vertexProject,
      })(modelName),
      provider: "vertex",
      modelName,
      source: "env",
    };
  }

  return null;
}
