-- Administrator-managed public brand and SEO image assets.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-assets',
  'site-assets',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "site assets public read" on storage.objects
  for select using (bucket_id = 'site-assets');
create policy "site assets content insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'site-assets' and (select public.has_admin_permission('content')));
create policy "site assets content update" on storage.objects
  for update to authenticated
  using (bucket_id = 'site-assets' and (select public.has_admin_permission('content')))
  with check (bucket_id = 'site-assets' and (select public.has_admin_permission('content')));
create policy "site assets content delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'site-assets' and (select public.has_admin_permission('content')));
