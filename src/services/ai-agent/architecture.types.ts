export interface ArchitectureViolation {
  file: string;
  severity: "critical" | "warning" | "info";
  rule:
    "direct_db_in_ui" | "missing_tenant_filter" | "unprotected_server_fn" | "missing_rls_policy";
  description: string;
  suggestedFix: string;
}

export interface ArchitectureHealthReport {
  score: number;
  violations: ArchitectureViolation[];
  metrics: {
    totalRoutes: number;
    totalComponents: number;
    totalServices: number;
    totalDbTables: number;
    tablesWithRlsCount: number;
    rlsCoveragePercentage: number;
    directDbBypassesCount: number;
  };
  scannedAt: string;
}
