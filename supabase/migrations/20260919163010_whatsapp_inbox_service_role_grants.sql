-- Webhook inserts use ON CONFLICT DO NOTHING; no update/delete privilege is needed.
GRANT SELECT, INSERT ON TABLE public.whatsapp_inbox TO service_role;
GRANT USAGE ON SEQUENCE public.whatsapp_inbox_id_seq TO service_role;
