/**
 * Phase 4.5 — Quality Engine RBAC & Security Permission Layer
 */

export type QualityRole =
  | "quality.viewer"
  | "quality.analyzer"
  | "quality.developer"
  | "quality.executor"
  | "quality.architect";

export interface QualityPermissionCheck {
  role: QualityRole;
  canViewReports: boolean;
  canViewIncidents: boolean;
  canViewSourceDiffs: boolean;
  canExecutePatches: boolean;
  canModifyArchitecture: boolean;
}

export function getQualityRolePermissions(role: QualityRole): QualityPermissionCheck {
  switch (role) {
    case "quality.architect":
      return {
        role,
        canViewReports: true,
        canViewIncidents: true,
        canViewSourceDiffs: true,
        canExecutePatches: true,
        canModifyArchitecture: true,
      };
    case "quality.executor":
      return {
        role,
        canViewReports: true,
        canViewIncidents: true,
        canViewSourceDiffs: true,
        canExecutePatches: true,
        canModifyArchitecture: false,
      };
    case "quality.developer":
      return {
        role,
        canViewReports: true,
        canViewIncidents: true,
        canViewSourceDiffs: true,
        canExecutePatches: false,
        canModifyArchitecture: false,
      };
    case "quality.analyzer":
      return {
        role,
        canViewReports: true,
        canViewIncidents: true,
        canViewSourceDiffs: false,
        canExecutePatches: false,
        canModifyArchitecture: false,
      };
    case "quality.viewer":
    default:
      return {
        role: "quality.viewer",
        canViewReports: true,
        canViewIncidents: false,
        canViewSourceDiffs: false,
        canExecutePatches: false,
        canModifyArchitecture: false,
      };
  }
}

export function assertQualityPermission(
  role: QualityRole,
  action: keyof Omit<QualityPermissionCheck, "role">,
): boolean {
  const perm = getQualityRolePermissions(role);
  return Boolean(perm[action]);
}
