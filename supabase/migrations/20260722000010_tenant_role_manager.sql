-- =========================================================
-- Store RBAC (Phase 3): add `manager` to tenant_role
-- =========================================================
-- Role mapping (Tenant = Electronic Store):
--   tenant_owner  = tenant_role.owner    (exists — full permissions)
--   store_manager = tenant_role.manager  (NEW — products/orders/inventory/reports)
--   store_staff   = tenant_role.staff    (exists — scoped operations)
--   (viewer kept for read-only access)
--
-- NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction block with
-- statements that use the new value — hence this dedicated migration file.

ALTER TYPE public.tenant_role ADD VALUE IF NOT EXISTS 'manager';
