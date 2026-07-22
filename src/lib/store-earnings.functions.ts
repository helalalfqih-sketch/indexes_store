/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveCurrentTenant } from "@/lib/saas/tenant-resolver";
import {
  getFinancialSummary,
  getStoreTransactions,
  resolveActiveFeeRule,
  type FinancialSummary,
  type FinancialTransaction,
  type FeeRule,
} from "@/lib/services/store-financial.service";

/**
 * /store/earnings server functions (P4).
 * Financial reads are OWNER + MANAGER only (spec) — enforced here via
 * has_tenant_permission('manager') AND by the ledger's RLS SELECT policy.
 */

export interface StoreEarnings {
  summary: FinancialSummary;
  transactions: FinancialTransaction[];
  feeRule: FeeRule | null;
}

export const getStoreEarnings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StoreEarnings | null> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };
    const tenantId = await resolveCurrentTenant(supabase, { userId });

    const { data: allowed } = await supabase.rpc("has_tenant_permission", {
      _tenant_id: tenantId,
      _user_id: userId,
      _required_role: "manager",
    });
    if (!allowed) return null;

    const [summary, transactions, feeRule] = await Promise.all([
      getFinancialSummary(supabase, tenantId),
      getStoreTransactions(supabase, tenantId, 50),
      resolveActiveFeeRule(supabase, tenantId),
    ]);
    return { summary, transactions, feeRule };
  });
