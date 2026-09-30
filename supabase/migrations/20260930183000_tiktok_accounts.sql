-- TikTok account OAuth integration for Indexes Store.
-- Target production project: wtudcippyxbaobqzbmok
-- OAuth tokens are encrypted application-side and stored only in a service-role table.
-- Authenticated staff can read tenant-scoped non-secret account metadata only.

BEGIN;

CREATE TABLE IF NOT EXISTS public.tiktok_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  open_id text NOT NULL,
  union_id text,
  display_name text NOT NULL DEFAULT 'TikTok account',
  avatar_url text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disconnected', 'error')),
  scopes text[] NOT NULL DEFAULT '{}'::text[],
  token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  last_synced_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, open_id)
);

CREATE INDEX IF NOT EXISTS idx_tiktok_accounts_tenant
  ON public.tiktok_accounts (tenant_id, status);

ALTER TABLE public.tiktok_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "TikTok accounts staff read" ON public.tiktok_accounts;
CREATE POLICY "TikTok accounts staff read"
  ON public.tiktok_accounts
  FOR SELECT TO authenticated
  USING (
    public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );

-- Account metadata writes remain server-only. The browser never INSERTs/UPDATEs/DELETEs.
REVOKE ALL ON public.tiktok_accounts FROM PUBLIC;
REVOKE ALL ON public.tiktok_accounts FROM anon;
REVOKE ALL ON public.tiktok_accounts FROM authenticated;
GRANT SELECT ON public.tiktok_accounts TO authenticated;
GRANT ALL ON public.tiktok_accounts TO service_role;

CREATE TABLE IF NOT EXISTS public.tiktok_account_secrets (
  account_id uuid PRIMARY KEY
    REFERENCES public.tiktok_accounts(id) ON DELETE CASCADE,
  access_token_encrypted text NOT NULL,
  refresh_token_encrypted text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tiktok_account_secrets ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.tiktok_account_secrets FROM PUBLIC;
REVOKE ALL ON public.tiktok_account_secrets FROM anon;
REVOKE ALL ON public.tiktok_account_secrets FROM authenticated;
GRANT ALL ON public.tiktok_account_secrets TO service_role;

CREATE TABLE IF NOT EXISTS public.tiktok_oauth_states (
  state_hash text PRIMARY KEY
    CHECK (char_length(state_hash) = 64),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  return_to text NOT NULL DEFAULT '/admin/integrations/tiktok',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tiktok_oauth_states_expires
  ON public.tiktok_oauth_states (expires_at);

ALTER TABLE public.tiktok_oauth_states ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.tiktok_oauth_states FROM PUBLIC;
REVOKE ALL ON public.tiktok_oauth_states FROM anon;
REVOKE ALL ON public.tiktok_oauth_states FROM authenticated;
GRANT ALL ON public.tiktok_oauth_states TO service_role;

COMMIT;
