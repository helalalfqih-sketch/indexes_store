-- Media storage portability foundation.
--
-- The object locator is the durable identity. file_url remains a delivery URL
-- for backwards compatibility and can change when CDN/storage providers move.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

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
