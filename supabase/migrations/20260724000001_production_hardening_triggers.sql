-- =========================================================
-- Production Hardening: Timestamp Triggers for Core Admin Tables
-- =========================================================

-- 1. Create or replace the timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper macro procedure for idempotent trigger creation
DO $$
DECLARE
  _tbl text;
  _tables text[] := ARRAY[
    'products',
    'categories',
    'orders',
    'order_items',
    'coupons',
    'storefront_settings',
    'media_files',
    'tenants',
    'profiles'
  ];
BEGIN
  FOREACH _tbl IN ARRAY _tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = _tbl
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = _tbl AND column_name = 'updated_at'
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at_%I ON public.%I;', _tbl, _tbl);
      EXECUTE format('CREATE TRIGGER set_updated_at_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', _tbl, _tbl);
    END IF;
  END LOOP;
END $$;
