-- Staging rollout only. No customer contact data is stored in these buckets.
CREATE TABLE IF NOT EXISTS public.native_checkout_rate_limits (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  bucket text NOT NULL,
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts > 0),
  PRIMARY KEY (tenant_id, bucket)
);
ALTER TABLE public.native_checkout_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.native_checkout_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_native_checkout_slot(_tenant_id uuid, _key text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_count integer;
  v_bucket text;
  v_cap integer;
BEGIN
  IF _key IS NULL OR _key !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'INVALID_RATE_KEY'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = _tenant_id AND status = 'active') THEN
    RAISE EXCEPTION 'TENANT_UNAVAILABLE';
  END IF;
  -- Always lock the global bucket first so concurrent requests cannot deadlock.
  FOREACH v_bucket IN ARRAY ARRAY['global', _key] LOOP
    v_cap := CASE WHEN v_bucket = 'global' THEN 100 ELSE 5 END;
    INSERT INTO public.native_checkout_rate_limits AS limits(tenant_id,bucket,window_start,attempts)
    VALUES (_tenant_id,v_bucket,v_now,1)
    ON CONFLICT (tenant_id,bucket) DO UPDATE SET
      attempts = CASE WHEN limits.window_start <= v_now - interval '10 minutes' THEN 1
                      ELSE LEAST(limits.attempts + 1, 101) END,
      window_start = CASE WHEN limits.window_start <= v_now - interval '10 minutes' THEN v_now
                          ELSE limits.window_start END
    RETURNING attempts INTO v_count;
    IF v_count > v_cap THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_native_checkout_slot(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_native_checkout_slot(uuid,text) TO service_role;
