/**
 * Enterprise Modular Quality Engine — Plugin Registry
 */
import { QualityAudit, AuditCategory, AuditEnvironment } from "./types";

export class AuditRegistry {
  private static instance: AuditRegistry;
  private auditors: Map<string, QualityAudit> = new Map();

  private constructor() {}

  public static getInstance(): AuditRegistry {
    if (!AuditRegistry.instance) {
      AuditRegistry.instance = new AuditRegistry();
    }
    return AuditRegistry.instance;
  }

  public register(auditor: QualityAudit): void {
    if (this.auditors.has(auditor.id)) {
      console.warn(`[AuditRegistry] Auditor '${auditor.id}' is already registered. Overwriting.`);
    }
    this.auditors.set(auditor.id, auditor);
  }

  public unregister(auditorId: string): boolean {
    return this.auditors.delete(auditorId);
  }

  public clear(): void {
    this.auditors.clear();
  }

  public getAuditor(id: string): QualityAudit | undefined {
    return this.auditors.get(id);
  }

  public getAllAuditors(): QualityAudit[] {
    return Array.from(this.auditors.values());
  }

  public getAuditorsFilter(
    category?: AuditCategory,
    env: AuditEnvironment = "local",
  ): QualityAudit[] {
    return Array.from(this.auditors.values()).filter((auditor) => {
      const matchCategory = !category || auditor.category === category;
      const matchEnv = auditor.environments.includes(env);
      return matchCategory && matchEnv;
    });
  }
}
