/**
 * Billing Service — PLACEHOLDER.
 *
 * Not wired to any payment provider yet. This module defines the surface so
 * downstream SaaS features (plan upgrades, invoices, dunning) have a stable
 * seam. Real providers (Stripe / Paddle / local YE gateways) will be added
 * as adapters under `src/lib/providers/billing/` in a future phase.
 *
 * TODO(Phase D): wire adapters and add BillingEvent persistence.
 */
import type { Plan } from "./plan.service";

export interface BillingProvider {
  readonly canCharge: boolean;
  startCheckout(input: {
    tenantId: string;
    plan: Plan;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string }>;
  cancelSubscription(input: { tenantId: string }): Promise<{ ok: boolean }>;
}

class NoopBillingProvider implements BillingProvider {
  readonly canCharge = false;
  async startCheckout() {
    throw new Error("Billing not configured. TODO: connect a provider in Phase D.");
    // eslint-disable-next-line @typescript-eslint/no-unreachable
    return { url: "" };
  }
  async cancelSubscription() {
    return { ok: true };
  }
}

export const billingService: BillingProvider = new NoopBillingProvider();
