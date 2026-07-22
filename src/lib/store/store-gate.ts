/**
 * StoreGate permission layer (Tenant = Electronic Store).
 *
 * Role hierarchy (mirrors has_tenant_permission in the database):
 *   owner  > manager > staff > viewer
 *
 * Permission map:
 *   owner   → full access (identity, settings, members, everything below)
 *   manager → products, orders, inventory, analytics, marketing
 *   staff   → day-to-day operations (orders handling, inventory recording)
 *   viewer  → read-only
 *
 * The UI gate lives in <StoreShell> (components/store/store-shell.tsx): no
 * /store page renders or fetches data before membership + role validation.
 * The database RLS policies remain the authoritative backstop.
 */

export type StoreRole = "owner" | "manager" | "staff" | "viewer";

const ROLE_RANK: Record<StoreRole, number> = {
  viewer: 0,
  staff: 1,
  manager: 2,
  owner: 3,
};

export function hasStorePermission(role: string | null | undefined, min: StoreRole): boolean {
  if (!role || !(role in ROLE_RANK)) return false;
  return ROLE_RANK[role as StoreRole] >= ROLE_RANK[min];
}

export const STORE_ROLE_LABELS: Record<StoreRole, string> = {
  owner: "مالك المتجر",
  manager: "مدير المتجر",
  staff: "موظف",
  viewer: "مُطالِع",
};

/** Section-level minimum roles (UI gating; server functions re-check). */
export const SECTION_MIN_ROLE: Record<string, StoreRole> = {
  dashboard: "viewer",
  products: "viewer",
  products_write: "staff",
  orders: "viewer",
  orders_write: "staff",
  inventory: "viewer",
  inventory_write: "staff",
  customers: "staff",
  marketing: "manager",
  analytics: "viewer",
  settings: "owner",
};
