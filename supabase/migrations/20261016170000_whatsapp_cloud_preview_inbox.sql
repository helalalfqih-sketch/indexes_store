-- Apply ONLY to an isolated reviewed Supabase STAGING project.
-- Never run on the live Indexes Store database.
CREATE TABLE IF NOT EXISTS public.wa_meta_preview_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waba_id text NOT NULL,
  phone_number_id text NOT NULL,
  external_event_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('message', 'status')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wa_meta_preview_events_dedupe
    UNIQUE (waba_id, phone_number_id, external_event_id, event_type)
);

CREATE INDEX IF NOT EXISTS wa_meta_preview_events_read_index
  ON public.wa_meta_preview_events (waba_id, phone_number_id, received_at DESC);

ALTER TABLE public.wa_meta_preview_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.wa_meta_preview_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.wa_meta_preview_events TO service_role;

COMMENT ON TABLE public.wa_meta_preview_events IS
  'Isolated WhatsApp Cloud API preview. New signed customer events only. Service role reads/writes; no public policies. Requires a separately approved retention and deletion policy before live traffic.';
