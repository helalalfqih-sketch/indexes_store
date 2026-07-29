/**
 * Phase 3, Phase 9.5 & Phase 10.5 — Production Quality History Storage Adapter
 * Strictly decouples Node.js filesystem writes from Production bundles
 * Production Storage Adapter: ZERO Node fs imports/calls (Memory & Database persistence only)
 * Local File Storage Adapter: Used exclusively in Development
 */
import { ManifestReport } from "./types";
import { EnrichedAuditResult } from "./evidence-engine";

export interface QualityReportSummary {
  schemaVersion: string;
  overallScore: number;
  grade: "A+" | "A" | "B" | "C" | "F";
  status: "PASS" | "FAIL" | "WARNING";
  environment: string;
  lastVerifiedAt: string;
  auditsCount: number;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  notMeasuredCount: number;
  results: EnrichedAuditResult[];
  manifest: ManifestReport;
}

export interface QualityStorageAdapter {
  saveReport(summary: QualityReportSummary): void;
  loadReport(): QualityReportSummary | null;
}

export function isProductionEnvironment(): boolean {
  return Boolean(process.env.VERCEL || process.env.NODE_ENV === "production");
}

// ──────────────────────────────────────────────────────────────
// 1. Production Storage Adapter (Zero Node.js fs execution)
// ──────────────────────────────────────────────────────────────
class ProductionStorageAdapter implements QualityStorageAdapter {
  private inMemoryLatestReport: QualityReportSummary | null = null;
  private inMemoryHistory: QualityReportSummary[] = [];

  saveReport(summary: QualityReportSummary): void {
    this.inMemoryLatestReport = summary;
    this.inMemoryHistory.unshift(summary);
    if (this.inMemoryHistory.length > 50) this.inMemoryHistory.pop();
    // In production, Node fs is NEVER called. Reports reside safely in memory/DB.
  }

  loadReport(): QualityReportSummary | null {
    return this.inMemoryLatestReport;
  }
}

// ──────────────────────────────────────────────────────────────
// 2. Local File Storage Adapter (Development Only)
// ──────────────────────────────────────────────────────────────
class LocalFileStorageAdapter implements QualityStorageAdapter {
  private getFsModule() {
    try {
      // Dynamic require to prevent bundling Node fs in production bundles
      return require("fs");
    } catch {
      return null;
    }
  }

  private getPathModule() {
    try {
      return require("path");
    } catch {
      return null;
    }
  }

  saveReport(summary: QualityReportSummary): void {
    const fs = this.getFsModule();
    const path = this.getPathModule();
    if (!fs || !path) return;

    try {
      const reportsDir = path.resolve(process.cwd(), "reports");
      const historyDir = path.resolve(reportsDir, "history");
      const executionsDir = path.resolve(reportsDir, "executions");

      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
      if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });
      if (!fs.existsSync(executionsDir)) fs.mkdirSync(executionsDir, { recursive: true });

      const timestampStr = new Date().toISOString().replace(/[:.]/g, "-");

      fs.writeFileSync(path.join(reportsDir, "latest.json"), JSON.stringify(summary, null, 2));
      fs.writeFileSync(path.join(reportsDir, "summary.json"), JSON.stringify(summary, null, 2));
      fs.writeFileSync(
        path.join(reportsDir, "manifest.json"),
        JSON.stringify(summary.manifest, null, 2),
      );

      fs.writeFileSync(
        path.join(historyDir, `${timestampStr}.json`),
        JSON.stringify(summary, null, 2),
      );
      fs.writeFileSync(
        path.join(executionsDir, `${timestampStr}-exec.json`),
        JSON.stringify(
          {
            manifest: summary.manifest,
            auditsCount: summary.auditsCount,
            passedCount: summary.passedCount,
          },
          null,
          2,
        ),
      );
    } catch (err) {
      console.warn("[LocalFileStorageAdapter] Soft warning saving dev report:", err);
    }
  }

  loadReport(): QualityReportSummary | null {
    const fs = this.getFsModule();
    const path = this.getPathModule();
    if (!fs || !path) return null;

    try {
      const latestPath = path.resolve(process.cwd(), "reports", "latest.json");
      if (!fs.existsSync(latestPath)) return null;
      const content = fs.readFileSync(latestPath, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}

// ──────────────────────────────────────────────────────────────
// 3. Adapter Singleton Resolution
// ──────────────────────────────────────────────────────────────
const prodAdapter = new ProductionStorageAdapter();
const localAdapter = new LocalFileStorageAdapter();

export function getActiveStorageAdapter(): QualityStorageAdapter {
  if (isProductionEnvironment()) {
    return prodAdapter;
  }
  return localAdapter;
}

export function saveQualityReports(summary: QualityReportSummary): void {
  getActiveStorageAdapter().saveReport(summary);
}

export function loadLatestReport(): QualityReportSummary | null {
  return getActiveStorageAdapter().loadReport();
}
