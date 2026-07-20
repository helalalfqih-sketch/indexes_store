ALTER TABLE public.products 
ADD COLUMN meta_sync_status text DEFAULT 'not_synced' CHECK (meta_sync_status IN ('not_synced', 'syncing', 'synced', 'failed'));
