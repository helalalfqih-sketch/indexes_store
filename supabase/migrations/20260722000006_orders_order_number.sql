-- =========================================================
-- orders.order_number — human-friendly, queryable order number
-- =========================================================
-- Required for: admin search by order number, and public tracking by
-- order_number + last-4-phone. Derived deterministically from the uuid
-- (same formula the frontend has used since PR #2: ORD- + first 8 hex chars),
-- so existing orders keep the exact number customers already received.
--
-- Missing-column migration only — no new tables, no RLS changes.
-- NOT unique: 8-hex prefixes can collide at scale; lookups always pair the
-- number with another factor (phone suffix) and admin search returns a list.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number text
  GENERATED ALWAYS AS ('ORD-' || upper(left(replace(id::text, '-', ''), 8))) STORED;

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
