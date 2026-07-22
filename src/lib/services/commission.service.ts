import type { SupabaseClient } from '@supabase/supabase-js';

type DB = SupabaseClient<any>;

export interface CommissionCalculation {
  grossAmount: number;
  commissionType: 'percentage' | 'fixed';
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
}

/**
 * Calculate marketplace commission based on vendor settings.
 */
export function calculateCommission(
  grossAmount: number,
  commissionType: 'percentage' | 'fixed',
  commissionRate: number,
  fixedAmount: number = 0
): CommissionCalculation {
  let commissionAmount = 0;

  if (commissionType === 'percentage') {
    commissionAmount = (grossAmount * commissionRate) / 100;
  } else {
    commissionAmount = fixedAmount;
  }

  // Ensure commission does not exceed gross amount
  commissionAmount = Math.min(grossAmount, Math.max(0, commissionAmount));
  const netAmount = Math.max(0, grossAmount - commissionAmount);

  return {
    grossAmount,
    commissionType,
    commissionRate,
    commissionAmount,
    netAmount,
  };
}

/**
 * Log commission breakdown for a vendor order.
 */
export async function logVendorCommission(
  db: DB,
  params: {
    tenantId: string;
    vendorId: string;
    orderId: string;
    vendorOrderId: string;
    grossAmount: number;
    commissionType: 'percentage' | 'fixed';
    commissionRate: number;
    fixedAmount?: number;
  }
) {
  const calc = calculateCommission(
    params.grossAmount,
    params.commissionType,
    params.commissionRate,
    params.fixedAmount ?? 0
  );

  const { data, error } = await db
    .from('vendor_commissions')
    .insert({
      tenant_id: params.tenantId,
      vendor_id: params.vendorId,
      order_id: params.orderId,
      vendor_order_id: params.vendorOrderId,
      gross_amount: calc.grossAmount,
      commission_type: calc.commissionType,
      commission_rate: calc.commissionRate,
      commission_amount: calc.commissionAmount,
      net_amount: calc.netAmount,
      payout_status: 'pending',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error logging vendor commission:', error);
    return null;
  }
  return data;
}

/**
 * Fetch commission history ledger for a vendor.
 */
export async function getVendorCommissionLedger(db: DB, vendorId: string) {
  const { data, error } = await db
    .from('vendor_commissions')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data;
}
