/**
 * Enterprise Modular Quality Engine — Core Execution Engine
 */
import {
  EngineRunOptions,
  QualityEngineInfo,
  AuditResult,
  QualityAudit,
  AuditCategory,
  AuditEnvironment,
  ManifestReport,
  AuditError,
} from "./types";
import { AuditRegistry } from "./registry";
import { createExecutionManifest } from "./manifest";
import { generateQualityReport } from "./report-generator";

export const ENGINE_INFO: QualityEngineInfo = {
  name: "NOQTA Quality Measurement Engine",
  version: "1.0.0",
  schemaVersion: "1.0.0",
  startedAt: new Date().toISOString(),
  environment: "local",
};

import { CompleteQualityReport } from "./report-generator";

export interface EngineRunSummary {
  engineInfo: QualityEngineInfo;
  results: AuditResult[];
  manifest: ManifestReport;
  report?: CompleteQualityReport;
  totalDurationMs: number;
}

/**
 * Runs an individual auditor with fault isolation, timeout enforcement, and AbortSignal support.
 */
async function runSingleAuditor(auditor: QualityAudit, signal?: AbortSignal): Promise<AuditResult> {
  const startTime = Date.now();
  const measuredAt = new Date().toISOString();

  // AbortCheck
  if (signal?.aborted) {
    return {
      auditId: auditor.id,
      name: auditor.name,
      status: "NOT_MEASURED",
      executionState: "SKIPPED",
      score: 0,
      category: auditor.category,
      source: "runtime",
      metrics: {},
      error: { code: "CANCELLED", message: "Audit execution aborted by user" },
      measuredAt,
      durationMs: 0,
    };
  }

  // Timeout Promise Wrapper
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<AuditResult>((resolve) => {
    timeoutId = setTimeout(() => {
      resolve({
        auditId: auditor.id,
        name: auditor.name,
        status: "FAIL",
        executionState: "FAILED",
        score: 0,
        category: auditor.category,
        source: "runtime",
        metrics: {},
        error: { code: "TIMEOUT", message: `Audit timed out after ${auditor.timeoutMs}ms` },
        measuredAt: new Date().toISOString(),
        durationMs: auditor.timeoutMs,
      });
    }, auditor.timeoutMs);
  });

  try {
    const auditPromise = auditor.run(signal);
    const result = await Promise.race([auditPromise, timeoutPromise]);
    return result;
  } catch (err: any) {
    const errorObj: AuditError = {
      code: err?.code || "UNHANDLED_EXCEPTION",
      message: err?.message || String(err),
      stack: err?.stack,
    };

    return {
      auditId: auditor.id,
      name: auditor.name,
      status: "FAIL",
      executionState: "FAILED",
      score: 0,
      category: auditor.category,
      source: "runtime",
      metrics: {},
      error: errorObj,
      measuredAt,
      durationMs: Date.now() - startTime,
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Unified Execution Entrypoint
 */
export async function runQualityAudit(options: EngineRunOptions = {}): Promise<EngineRunSummary> {
  const startTime = Date.now();
  const env: AuditEnvironment = options.environment || "local";
  const registry = AuditRegistry.getInstance();
  const allAuditors = registry.getAllAuditors();

  const currentEngineInfo: QualityEngineInfo = {
    ...ENGINE_INFO,
    startedAt: new Date().toISOString(),
    environment: env,
  };

  const eligibleAuditors: QualityAudit[] = [];
  const skippedAudits: { id: string; reason: string }[] = [];

  for (const auditor of allAuditors) {
    if (options.category && auditor.category !== options.category) {
      skippedAudits.push({
        id: auditor.id,
        reason: `Category mismatch (${auditor.category} != ${options.category})`,
      });
      continue;
    }
    if (!auditor.environments.includes(env)) {
      skippedAudits.push({
        id: auditor.id,
        reason: `Environment mismatch (${auditor.environments.join(",")} != ${env})`,
      });
      continue;
    }
    eligibleAuditors.push(auditor);
  }

  // Fault-isolated execution across eligible auditors
  const results: AuditResult[] = [];
  for (const auditor of eligibleAuditors) {
    if (options.signal?.aborted) {
      skippedAudits.push({ id: auditor.id, reason: "Execution cancelled via AbortSignal" });
      continue;
    }
    const result = await runSingleAuditor(auditor, options.signal);
    results.push(result);
  }

  const totalDurationMs = Date.now() - startTime;
  const manifest = createExecutionManifest(
    currentEngineInfo,
    results,
    skippedAudits,
    totalDurationMs,
  );

  // Phase 3 Evidence & Reporting Platform Pipeline
  const completeReport = generateQualityReport(currentEngineInfo, results, manifest);

  return {
    engineInfo: currentEngineInfo,
    results,
    manifest,
    report: completeReport,
    totalDurationMs,
  };
}
