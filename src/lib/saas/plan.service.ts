/**
 * Plan Service — SaaS plan limits & entitlements.
 * Pure data; no billing side-effects. Billing wiring is a placeholder.
 */
import type { Database } from "@/integrations/supabase/types";

export type Plan = Database["public"]["Enums"]["tenant_plan"];

export interface PlanLimits {
  maxProducts: number;         // Infinity for unlimited
  maxAdmins: number;
  analytics: boolean;
  customDomain: boolean;
  prioritySupport: boolean;
  label: string;
}

const LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxProducts: 50,
    maxAdmins: 1,
    analytics: false,
    customDomain: false,
    prioritySupport: false,
    label: "Free",
  },
  pro: {
    maxProducts: 1000,
    maxAdmins: 5,
    analytics: true,
    customDomain: true,
    prioritySupport: false,
    label: "Pro",
  },
  enterprise: {
    maxProducts: Number.POSITIVE_INFINITY,
    maxAdmins: Number.POSITIVE_INFINITY,
    analytics: true,
    customDomain: true,
    prioritySupport: true,
    label: "Enterprise",
  },
};

export const planService = {
  limitsFor(plan: Plan): PlanLimits {
    return LIMITS[plan];
  },
  canAddProduct(plan: Plan, current: number): boolean {
    return current < LIMITS[plan].maxProducts;
  },
  canAddAdmin(plan: Plan, current: number): boolean {
    return current < LIMITS[plan].maxAdmins;
  },
  allPlans(): Array<Plan> {
    return ["free", "pro", "enterprise"];
  },
};
