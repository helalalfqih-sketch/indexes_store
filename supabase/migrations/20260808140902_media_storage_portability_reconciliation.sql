-- Media storage portability foundation.
--
-- The object locator is the durable identity. file_url remains a delivery URL
-- for backwards compatibility and can change when CDN/storage providers move.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

-- ---------------------------------------------------------------------------
-- 1. Reconcile the media schema expected by the current application.
-- ---------------------------------------------------------------------------

alter table public.media_files
  add column if not exists sequence_number bigint,
  add column if not exists thumbnail_url text;

with numbered as (
  select
    id,
    row_number() over (
      partition by tenant_id
      order by created_at asc, id asc
    ) as sequence_number
  from public.media_files
)
update public.media_files as media
set sequence_number = numbered.sequence_number
from numbered
where media.id = numbered.id
  and media.sequence_number is null;

create or replace function public.set_media_sequence_number()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
declare
  next_sequence bigint;
begin
  if new.sequence_number is null then
    select coalesce(max(media.sequence_number), 0) + 1
      into next_sequence
    from public.media_files as media
    where media.tenant_id = new.tenant_id;

    new.sequence_number := next_sequence;
  end if;

  return new;
end;
$function$;

drop trigger if exists trigger_media_sequence_number on public.media_files;
create trigger trigger_media_sequence_number
  before insert on public.media_files
  for each row
  execute function public.set_media_sequence_number();

create index if not exists idx_media_files_sequence
  on public.media_files (tenant_id, sequence_number desc);

-- Composite keys make tenant identity part of the media relationship itself,
-- preventing a link row from pairing a product with another tenant's media.
do $tenant_keys$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_tenant_id_id_key'
  ) then
    alter table public.products
      add constraint products_tenant_id_id_key unique (tenant_id, id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.media_files'::regclass
      and conname = 'media_files_tenant_id_id_key'
  ) then
    alter table public.media_files
      add constraint media_files_tenant_id_id_key unique (tenant_id, id);
  end if;
end
$tenant_keys$;

create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null,
  media_id uuid not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_media_product_media_key unique (product_id, media_id),
  constraint product_media_tenant_product_fkey
    foreign key (tenant_id, product_id)
    references public.products(tenant_id, id)
    on delete cascade,
  constraint product_media_tenant_media_fkey
    foreign key (tenant_id, media_id)
    references public.media_files(tenant_id, id)
    on delete cascade
);

do $product_media_shape$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_media'
      and column_name = 'tenant_id'
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_media'
      and column_name = 'product_id'
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_media'
      and column_name = 'media_id'
  ) then
    raise exception 'product_media exists with an incompatible schema; reconciliation aborted';
  end if;
end
$product_media_shape$;

create index if not exists idx_product_media_product
  on public.product_media (product_id, sort_order asc);
create index if not exists idx_product_media_media
  on public.product_media (media_id);
create index if not exists idx_product_media_tenant
  on public.product_media (tenant_id);

alter table public.product_media enable row level security;

drop policy if exists "Public read product_media" on public.product_media;
drop policy if exists "Published product media read" on public.product_media;
create policy "Published product media read"
  on public.product_media
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.products as product
      where product.id = product_media.product_id
        and product.tenant_id = product_media.tenant_id
        and product.is_published = true
    )
  );

drop policy if exists "Tenant members manage product_media" on public.product_media;
create policy "Tenant members manage product_media"
  on public.product_media
  for all
  to authenticated
  using (
    public.can_manage_tenant(tenant_id, (select auth.uid()))
  )
  with check (
    public.can_manage_tenant(tenant_id, (select auth.uid()))
  );

revoke all on table public.product_media from anon, authenticated;
grant select on table public.product_media to anon;
grant select, insert, update, delete on table public.product_media to authenticated;
grant all on table public.product_media to service_role;

-- ---------------------------------------------------------------------------
-- 2. Add provider-neutral storage identity.
-- ---------------------------------------------------------------------------

alter table public.media_files
  add column if not exists storage_provider text,
  add column if not exists storage_bucket text,
  add column if not exists object_key text;

do $constraints$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.media_files'::regclass
      and conname = 'media_files_storage_locator_complete'
  ) then
    alter table public.media_files
      add constraint media_files_storage_locator_complete
      check (
        (storage_provider is null and storage_bucket is null and object_key is null)
        or
        (
          nullif(btrim(storage_provider), '') is not null
          and nullif(btrim(storage_bucket), '') is not null
          and nullif(btrim(object_key), '') is not null
        )
      ) not valid;
  end if;
end
$constraints$;

-- Backfill only objects we can positively identify as already living in the
-- current Supabase public bucket. Firebase/external URLs are intentionally left
-- untouched until their object bytes have been copied and verified.
update public.media_files
set storage_provider = 'supabase',
    storage_bucket = 'product-images',
    object_key = file_path
where storage_provider is null
  and storage_bucket is null
  and object_key is null
  and nullif(btrim(file_path), '') is not null
  and file_url like 'https://%.supabase.co/storage/v1/object/public/product-images/%';

alter table public.media_files
  validate constraint media_files_storage_locator_complete;

create index if not exists idx_media_files_storage_locator
  on public.media_files (tenant_id, storage_provider, storage_bucket, object_key)
  where object_key is not null;

-- Keep the legacy upload path working during the transition. New rows written
-- by the existing application are automatically given a durable locator when
-- their delivery URL proves they are already stored in this Supabase bucket.
create or replace function public.set_media_storage_locator()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
begin
  if new.storage_provider is null
     and new.storage_bucket is null
     and new.object_key is null
     and nullif(btrim(new.file_path), '') is not null
     and new.file_url like 'https://%.supabase.co/storage/v1/object/public/product-images/%' then
    new.storage_provider := 'supabase';
    new.storage_bucket := 'product-images';
    new.object_key := new.file_path;
  end if;

  return new;
end;
$function$;

drop trigger if exists trigger_media_storage_locator on public.media_files;
create trigger trigger_media_storage_locator
  before insert or update of file_path, file_url, storage_provider, storage_bucket, object_key
  on public.media_files
  for each row
  execute function public.set_media_storage_locator();

comment on column public.media_files.storage_provider is
  'Storage provider identifier (for example supabase or r2); NULL for external/legacy media.';
comment on column public.media_files.storage_bucket is
  'Provider bucket/container name. Together with object_key forms the durable object identity.';
comment on column public.media_files.object_key is
  'Provider-relative object key. Prefer this identity over persisting provider delivery URLs.';

notify pgrst, 'reload schema';

commit;

