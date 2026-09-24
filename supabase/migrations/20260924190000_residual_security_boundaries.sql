-- Bind inventory writes to the product's tenant, including direct REST inserts.
-- Live databases may already have an equivalent key; fresh installs need one too.
CREATE UNIQUE INDEX IF NOT EXISTS products_tenant_id_id_security_key ON public.products(tenant_id, id);
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_product_tenant_fkey
  FOREIGN KEY (tenant_id, product_id) REFERENCES public.products(tenant_id, id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.apply_inventory_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.products SET stock = GREATEST(stock + NEW.delta, 0)
  WHERE id = NEW.product_id AND tenant_id = NEW.tenant_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid product tenant'; END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.guard_tenant_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'service_role')
     AND NOT COALESCE(public.has_role(auth.uid(), 'admin'), false)
     AND (to_jsonb(NEW) - ARRAY['name','slug','settings','updated_at']) IS DISTINCT FROM
         (to_jsonb(OLD) - ARRAY['name','slug','settings','updated_at']) THEN
    RAISE EXCEPTION 'Only a platform administrator can change protected tenant fields' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER guard_tenant_fields BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.guard_tenant_fields();

DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated view profiles" ON public.profiles;
CREATE POLICY profiles_select_own_or_admin ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Only an operator-selected account can reach this function through the server.
CREATE FUNCTION public.bootstrap_first_admin(target_user uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(741925103);
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (target_user, 'admin');
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.bootstrap_first_admin(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin(uuid) TO service_role;

-- Atomic daily budget persists across server instances. Authorization is checked
-- separately by the server before calling this self-only quota function.
CREATE TABLE public.ai_daily_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL,
  requests integer NOT NULL CHECK (requests BETWEEN 1 AND 100),
  PRIMARY KEY (user_id, day)
);
ALTER TABLE public.ai_daily_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_daily_usage FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.consume_ai_request() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE accepted integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.ai_daily_usage(user_id, day, requests)
  VALUES (auth.uid(), (now() AT TIME ZONE 'UTC')::date, 1)
  ON CONFLICT (user_id, day) DO UPDATE SET requests = ai_daily_usage.requests + 1
  WHERE ai_daily_usage.requests < 100 RETURNING requests INTO accepted;
  RETURN accepted IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_ai_request() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_request() TO authenticated;
