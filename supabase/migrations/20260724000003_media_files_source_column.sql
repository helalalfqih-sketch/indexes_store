-- Migration: Add source column to media_files
-- Purpose: Track where a media file originated (e.g. 'upload', 'whatsapp', 'ai_generated')
-- Safe: IF NOT EXISTS makes this fully idempotent

ALTER TABLE public.media_files
  ADD COLUMN IF NOT EXISTS source text;

-- Optional: back-fill existing rows from metadata->>'source' if present
UPDATE public.media_files
SET source = metadata->>'source'
WHERE source IS NULL
  AND metadata->>'source' IS NOT NULL;

-- Add an index for filtering by source in Media Library
CREATE INDEX IF NOT EXISTS idx_media_files_source
  ON public.media_files(tenant_id, source);

-- Reload PostgREST schema cache so the new column is visible immediately
NOTIFY pgrst, 'reload schema';
