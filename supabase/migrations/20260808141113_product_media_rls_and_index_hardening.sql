-- Tighten product_media RLS and cover its tenant-scoped foreign keys.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

create index if not exists idx_product_media_tenant_product
  on public.product_media (tenant_id, product_id);

create index if not exists idx_product_media_tenant_media
  on public.product_media (tenant_id, media_id);

drop policy if exists "Published product media read" on public.product_media;
drop policy if exists "Tenant members manage product_media" on public.product_media;
drop policy if exists "Published product media read anon" on public.product_media;
drop policy if exists "Published or tenant product media read" on public.product_media;
drop policy if exists "Tenant members insert product_media" on public.product_media;
drop policy if exists "Tenant members update product_media" on public.product_media;
drop policy if exists "Tenant members delete product_media" on public.product_media;

create policy "Published product media read anon"
  on public.product_media
  for select
  to anon
  using (
    exists (
      select 1
      from public.products as product
      where product.id = product_media.product_id
        and product.tenant_id = product_media.tenant_id
        and product.is_published = true
    )
  );

create policy "Published or tenant product media read"
  on public.product_media
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.products as product
      where product.id = product_media.product_id
        and product.tenant_id = product_media.tenant_id
        and product.is_published = true
    )
    or public.can_manage_tenant(tenant_id, (select auth.uid()))
  );

create policy "Tenant members insert product_media"
  on public.product_media
  for insert
  to authenticated
  with check (
    public.can_manage_tenant(tenant_id, (select auth.uid()))
  );

create policy "Tenant members update product_media"
  on public.product_media
  for update
  to authenticated
  using (
    public.can_manage_tenant(tenant_id, (select auth.uid()))
  )
  with check (
    public.can_manage_tenant(tenant_id, (select auth.uid()))
  );

create policy "Tenant members delete product_media"
  on public.product_media
  for delete
  to authenticated
  using (
    public.can_manage_tenant(tenant_id, (select auth.uid()))
  );

notify pgrst, 'reload schema';

commit;
