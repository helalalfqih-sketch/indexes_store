import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";

// Hoisted mock for tenant-context
vi.mock("@/lib/saas/tenant-context", () => ({
  resolveTenantId: vi.fn(async (client: unknown, opts: Record<string, unknown>) => {
    if (opts?.userId === "fail_tenant") throw new Error("Tenant error");
    if (!opts?.userId) return null;
    return "test-tenant-uuid";
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
    },
  },
}));

import {
  checkTenantPermission,
  PermissionDeniedError,
  ConfigurationError,
} from "@/lib/users.functions";
import { getMediaFilesByIds, fetchMediaFilesByIdsCore } from "@/lib/media.functions";
import {
  sanitizeContextData,
  generateIncidentFingerprint,
  isExpectedAuthRedirect,
  processIngestedIncident,
} from "@/services/runtime-incidents/incident-ingestion.service";

describe("P0 Security Suite — Tenant RBAC & Authorization (Fail-Closed)", () => {
  it("should throw PermissionDeniedError when no userId or session exists", async () => {
    await expect(checkTenantPermission("products", {})).rejects.toThrow(PermissionDeniedError);
  });

  it("should throw ConfigurationError when tenant resolution fails", async () => {
    const mockContext = {
      userId: "fail_tenant",
      supabase: {
        auth: { getUser: async () => ({ data: { user: { id: "fail_tenant" } } }) },
      },
    };

    await expect(checkTenantPermission("products", mockContext)).rejects.toThrow(
      ConfigurationError,
    );
  });

  it("should allow tenant owners full permission", async () => {
    const userId = "owner_user_id";

    const mockClient = {
      from: (table: string) => {
        if (table === "user_roles") {
          return { select: () => ({ eq: () => Promise.resolve({ data: [] }) }) };
        }
        if (table === "tenants") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { owner_user_id: userId } }),
              }),
            }),
          };
        }
        return {};
      },
    };

    const mockContext = { userId, supabase: mockClient };
    const result = await checkTenantPermission("products", mockContext);
    expect(result).toBe(true);
  });

  it("should deny non-members with PermissionDeniedError", async () => {
    const userId = "non_member_user_id";

    const mockClient = {
      from: (table: string) => {
        if (table === "user_roles") {
          return { select: () => ({ eq: () => Promise.resolve({ data: [] }) }) };
        }
        if (table === "tenants") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { owner_user_id: "other_owner" } }),
              }),
            }),
          };
        }
        if (table === "tenant_members") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      },
    };

    const mockContext = { userId, supabase: mockClient };
    await expect(checkTenantPermission("settings", mockContext)).rejects.toThrow(
      PermissionDeniedError,
    );
  });
});

describe("P0 Security Suite — Media Files & Sequence Schema Integrity", () => {
  it("sequence_number migration exists and contains required idempotent schema definitions", () => {
    const migrationPath = path.resolve(
      __dirname,
      "../../supabase/migrations/20260730_add_media_files_sequence_number.sql",
    );
    expect(fs.existsSync(migrationPath)).toBe(true);
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS sequence_number INT DEFAULT 0");
    expect(sql).toContain("CREATE TRIGGER trigger_media_sequence_number");
    expect(sql).toContain("idx_media_files_tenant_sequence");
    expect(sql).toContain("NOTIFY pgrst, 'reload schema'");
  });

  it("getMediaFilesByIds throws MEDIA_SEQUENCE_SCHEMA_MISSING on PostgreSQL 42703 error", async () => {
    const mockDb = {
      from: () => ({
        select: () => ({
          eq: () => ({
            in: () => ({
              order: async () => ({
                data: null,
                error: { code: "42703", message: "column sequence_number does not exist" },
              }),
            }),
          }),
        }),
      }),
    };

    const validUuid = "11111111-1111-1111-1111-111111111111";
    await expect(fetchMediaFilesByIdsCore(mockDb, "test-tenant-uuid", [validUuid])).rejects.toThrow(
      "MEDIA_SEQUENCE_SCHEMA_MISSING",
    );
  });

  it("getMediaFilesByIds throws generic error instead of returning [] on database error", async () => {
    const mockDb = {
      from: () => ({
        select: () => ({
          eq: () => ({
            in: () => ({
              order: async () => ({
                data: null,
                error: { code: "50000", message: "Connection timeout" },
              }),
            }),
          }),
        }),
      }),
    };

    const validUuid = "22222222-2222-2222-2222-222222222222";
    await expect(fetchMediaFilesByIdsCore(mockDb, "test-tenant-uuid", [validUuid])).rejects.toThrow(
      "Failed to fetch media records",
    );
  });

  it("media.functions.ts contains zero runtime bucket creation calls", () => {
    const fileContent = fs.readFileSync(
      path.resolve(__dirname, "../../src/lib/media.functions.ts"),
      "utf-8",
    );
    expect(fileContent).not.toContain("storage.createBucket");
    expect(fileContent).not.toContain("ensureBucketExists");
  });
});

describe("P0 Security Suite — Incident Center Ingestion, Sanitization & Fingerprinting", () => {
  it("sanitizes passwords, secrets, bearer tokens, and signed URL parameters", () => {
    const rawContext = {
      password: "SuperSecretPassword123!",
      user_token: "bearer-xyz-secret",
      signed_url: "https://storage.supabase.co/file.png?token=secret123&sig=abc456",
      normalField: "public_value",
    };

    const sanitized = sanitizeContextData(rawContext);
    expect(sanitized.password).toBe("[REDACTED_SENSITIVE_DATA]");
    expect(sanitized.user_token).toBe("[REDACTED_SENSITIVE_DATA]");
    expect(sanitized.signed_url).toBe(
      "https://storage.supabase.co/file.png?token=[REDACTED]&sig=[REDACTED]",
    );
    expect(sanitized.normalField).toBe("public_value");
  });

  it("generates deterministic SHA-256 fingerprint for error deduplication", () => {
    const fp1 = generateIncidentFingerprint(
      "error",
      "server",
      "Database connection lost to 10.0.0.1:5432",
    );
    const fp2 = generateIncidentFingerprint(
      "error",
      "server",
      "Database connection lost to 10.0.0.2:5432",
    );
    expect(fp1).toBe(fp2); // Normalized IPs match same fingerprint
  });

  it("filters out expected auth redirects from runtime incident ingestion", () => {
    const redirectPayload = {
      message: "Unauthorized: No token provided. Redirecting to /auth?next=/account",
      statusCode: 401,
    };
    expect(isExpectedAuthRedirect(redirectPayload)).toBe(true);
  });

  it("classifies HTTP 200 with application error payload as semantic failure incident", async () => {
    let insertedRow: Record<string, unknown> | null = null;
    const mockDb = {
      from: () => ({
        select: () => ({
          eq: () => ({
            or: () => ({
              maybeSingle: async () => ({ data: null }),
            }),
          }),
        }),
        insert: (row: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              insertedRow = row;
              return { data: { id: "inc-123" }, error: null };
            },
          }),
        }),
      }),
    };

    const payload = {
      statusCode: 200,
      responseBody: { error: "Payment gateway failed silently" },
      message: "HTTP 200 OK",
    };

    const res = await processIngestedIncident(mockDb, "tenant-1", payload);
    expect(res.ingested).toBe(true);
    expect(insertedRow.title).toContain("Semantic Failure");
    expect(insertedRow.message).toContain("Payment gateway failed silently");
  });
});

describe("P0 Security Suite — UI State & Polling Constraints", () => {
  it("AI Developer initial build state is NOT_MEASURED", () => {
    const developerFile = fs.readFileSync(
      path.resolve(__dirname, "../../src/routes/admin.ai-developer.tsx"),
      "utf-8",
    );
    expect(developerFile).toContain('status: "NOT_MEASURED"');
    expect(developerFile).not.toContain(
      'passed: true,\n    errorCount: 0,\n    summary: "Build validated cleanly with 0 errors."',
    );
  });

  it("AI Developer disables execution journal background polling when idle", () => {
    const developerFile = fs.readFileSync(
      path.resolve(__dirname, "../../src/routes/admin.ai-developer.tsx"),
      "utf-8",
    );
    expect(developerFile).toContain("refetchIntervalInBackground: false");
    expect(developerFile).toContain("refetchInterval: isExecuting ? 5000 : false");
  });

  it("admin.products.tsx does not leak CATALOG_IMPORT_URL to browser bundle", () => {
    const adminProductsFile = fs.readFileSync(
      path.resolve(__dirname, "../../src/routes/admin.products.tsx"),
      "utf-8",
    );
    expect(adminProductsFile).not.toContain("VITE_CATALOG_IMPORT_URL");
    expect(adminProductsFile).not.toContain("const CATALOG_IMPORT_URL");
  });

  it("keeps configured catalog URLs and storage tokens out of client-facing code", () => {
    const clientFiles = [
      "../../src/routes/admin.products.tsx",
      "../../src/lib/actions/admin.actions.ts",
    ];

    for (const relativeFile of clientFiles) {
      const source = fs.readFileSync(path.resolve(__dirname, relativeFile), "utf-8");
      expect(source).not.toContain("VITE_CATALOG_IMPORT_URL");
      expect(source).not.toContain("firebasestorage.googleapis.com/v0/b/smartcontentcreator");
      expect(source).not.toMatch(/[?&]token=[A-Za-z0-9_-]+/);
    }
  });

  it("contains no obsolete hardcoded catalog token fallback", () => {
    const catalogFunctionsFile = fs.readFileSync(
      path.resolve(__dirname, "../../src/lib/catalog.functions.ts"),
      "utf-8",
    );
    expect(catalogFunctionsFile).not.toContain("GLOBAL_CSV_URL");
    expect(catalogFunctionsFile).not.toMatch(/[?&]token=[A-Za-z0-9_-]+/);
    expect(catalogFunctionsFile).not.toContain("process.env.CATALOG_IMPORT_URL");
    expect(catalogFunctionsFile).not.toContain("fetchCsvProducts");
    expect(catalogFunctionsFile).not.toContain("firebasestorage.googleapis.com");
  });

  it("keeps catalog database reads and writes in bounded batches", () => {
    const importerFile = fs.readFileSync(
      path.resolve(__dirname, "../../src/lib/catalog-import.functions.ts"),
      "utf-8",
    );
    expect(importerFile).toContain("export const CATALOG_IMPORT_BATCH_SIZE = 50");
    expect(importerFile).toContain("start += CATALOG_IMPORT_BATCH_SIZE");
    expect(importerFile).toContain(".slice(start, start + CATALOG_IMPORT_BATCH_SIZE)");
  });

  it("queries only verified product media columns before merging existing media", () => {
    const importerFile = fs.readFileSync(
      path.resolve(__dirname, "../../src/lib/catalog-import.functions.ts"),
      "utf-8",
    );
    expect(importerFile).toContain('.select("external_id,slug,images,video_playback_id")');
    expect(importerFile).toContain("mergeImportedImages");
    expect(importerFile).toContain("video_playback_id");
  });
});
