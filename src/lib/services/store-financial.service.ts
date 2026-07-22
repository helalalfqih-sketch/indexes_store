/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Store Financial Service (P4) — single data layer for the immutable ledger
 * `tenant_financial_transactions` and fee resolution from `tenant_commissions`.
 *
 * Write model: ledger rows are written ONLY through recordTransaction /
 * recordOrderIncome with the SERVICE-ROLE client (no client INSERT policy
 * exists). Reads use the member's RLS-scoped client (manager+ per policy).
 */

type Db = any;

export type TransactionType =
  | "order_income"
  | "platform_fee"
  | "refund"
  | "adjustment"
  | "subscription_charge";

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  reference_type: string | null;
  reference_id: string | null;
  note: string | null;
  created_at: string;
}

export interface FeeRule {
  id: string;
  tenant_id: string | null;
  type: "percentage" | "fixed";
  value: number;
}

export interface FinancialSummary {
  gross: number;
  fees: number;
  refunds: number;
  net: number;
  transactionsCount: number;
  currency: string;
  /** last 6 months, oldest → newest */
  monthly: Array<{ month: string; income: number; fees: number; net: number }>;
}

// ── Fee resolution & calculation ─────────────────────────────────────────────

/** Active fee rule: store-specific first, else the platform default (tenant IS NULL). */
export async function resolveActiveFeeRule(db: Db, tenantId: string): Promise<FeeRule | null> {
  const { data } = await db
    .from("tenant_commissions")
    .select("id, tenant_id, type, value")
    .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
    .eq("active", true)
    .order("effective_from", { ascending: false })
    .limit(10);
  const rules = (data ?? []) as FeeRule[];
  return rules.find((r) => r.tenant_id === tenantId) ?? rules.find((r) => r.tenant_id === null) ?? null;
}

export function calculatePlatformFee(rule: FeeRule | null, base: number): number {
  if (!rule || base <= 0) return 0;
  const fee = rule.type === "percentage" ? (base * Number(rule.value)) / 100 : Number(rule.value);
  return Math.min(Math.max(0, Math.round(fee * 100) / 100), base);
}

// ── Ledger writes (SERVICE ROLE ONLY) ────────────────────────────────────────

export async function recordTransaction(
  adminDb: Db,
  entry: {
    tenantId: string;
    type: TransactionType;
    amount: number;
    currency: string;
    referenceType?: string;
    referenceId?: string | null;
    note?: string;
  },
): Promise<{ ok: boolean; message?: string }> {
  if (entry.amount <= 0) return { ok: true }; // nothing to record
  const { error } = await adminDb.from("tenant_financial_transactions").insert({
    tenant_id: entry.tenantId,
    type: entry.type,
    amount: Math.round(entry.amount * 100) / 100,
    currency: entry.currency,
    reference_type: entry.referenceType ?? null,
    reference_id: entry.referenceId ?? null,
    note: entry.note ?? null,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

/**
 * Order completion hook: records order_income + platform_fee for a delivered
 * order. IDEMPOTENT — checks the ledger for an existing order_income row with
 * the same reference before writing (safe against repeated status flips).
 */
export async function recordOrderIncome(
  adminDb: Db,
  order: { id: string; tenant_id: string; total: number; currency: string },
): Promise<{ ok: boolean; skipped?: boolean; message?: string }> {
  const { data: existing } = await adminDb
    .from("tenant_financial_transactions")
    .select("id")
    .eq("reference_id", order.id)
    .eq("type", "order_income")
    .limit(1)
    .maybeSingle();
  if (existing) return { ok: true, skipped: true };

  const gross = Number(order.total ?? 0);
  const rule = await resolveActiveFeeRule(adminDb, order.tenant_id);
  const fee = calculatePlatformFee(rule, gross);

  const r1 = await recordTransaction(adminDb, {
    tenantId: order.tenant_id,
    type: "order_income",
    amount: gross,
    currency: order.currency ?? "YER",
    referenceType: "order",
    referenceId: order.id,
    note: "إيراد طلب مُسلَّم",
  });
  if (!r1.ok) return r1;

  if (fee > 0) {
    await recordTransaction(adminDb, {
      tenantId: order.tenant_id,
      type: "platform_fee",
      amount: fee,
      currency: order.currency ?? "YER",
      referenceType: "order",
      referenceId: order.id,
      note: rule ? `رسوم المنصّة (${rule.type === "percentage" ? `${rule.value}%` : "ثابت"})` : undefined,
    });
  }
  return { ok: true };
}

/** Refund hook: records a refund row for a refunded order (idempotent). */
export async function recordOrderRefund(
  adminDb: Db,
  order: { id: string; tenant_id: string; total: number; currency: string },
): Promise<{ ok: boolean; skipped?: boolean }> {
  const { data: existing } = await adminDb
    .from("tenant_financial_transactions")
    .select("id")
    .eq("reference_id", order.id)
    .eq("type", "refund")
    .limit(1)
    .maybeSingle();
  if (existing) return { ok: true, skipped: true };
  await recordTransaction(adminDb, {
    tenantId: order.tenant_id,
    type: "refund",
    amount: Number(order.total ?? 0),
    currency: order.currency ?? "YER",
    referenceType: "order",
    referenceId: order.id,
    note: "استرجاع طلب",
  });
  return { ok: true };
}

// ── Reads (member RLS client — manager+) ────────────────────────────────────

export async function getStoreTransactions(
  db: Db,
  tenantId: string,
  limit = 50,
): Promise<FinancialTransaction[]> {
  const { data, error } = await db
    .from("tenant_financial_transactions")
    .select("id, type, amount, currency, reference_type, reference_id, note, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as FinancialTransaction[];
}

export async function getFinancialSummary(db: Db, tenantId: string): Promise<FinancialSummary> {
  const { data } = await db
    .from("tenant_financial_transactions")
    .select("type, amount, currency, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(5000);

  const rows = (data ?? []) as Array<{ type: TransactionType; amount: number; currency: string; created_at: string }>;
  let gross = 0;
  let fees = 0;
  let refunds = 0;
  let currency = "YER";

  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const months: string[] = [];
  const nowD = new Date();
  for (let i = 5; i >= 0; i--) {
    months.push(monthKey(new Date(nowD.getFullYear(), nowD.getMonth() - i, 1)));
  }
  const monthly = new Map(months.map((m) => [m, { month: m, income: 0, fees: 0, net: 0 }]));

  for (const r of rows) {
    const amt = Number(r.amount ?? 0);
    if (r.currency) currency = r.currency;
    if (r.type === "order_income") gross += amt;
    else if (r.type === "platform_fee" || r.type === "subscription_charge") fees += amt;
    else if (r.type === "refund") refunds += amt;

    const mk = monthKey(new Date(r.created_at));
    const bucket = monthly.get(mk);
    if (bucket) {
      if (r.type === "order_income") bucket.income += amt;
      else if (r.type === "platform_fee" || r.type === "subscription_charge") bucket.fees += amt;
      else if (r.type === "refund") bucket.income -= amt;
      bucket.net = bucket.income - bucket.fees;
    }
  }

  return {
    gross,
    fees,
    refunds,
    net: gross - fees - refunds,
    transactionsCount: rows.length,
    currency,
    monthly: Array.from(monthly.values()),
  };
}
