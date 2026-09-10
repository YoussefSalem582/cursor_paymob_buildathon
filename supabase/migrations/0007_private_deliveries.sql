-- Private deliveries: the object URL must not unlock the file.
-- preview_url / final_url store a path (or a legacy public URL). The server mints signed URLs.

insert into storage.buckets (id, name, public)
values ('deliveries', 'deliveries', false)
on conflict (id) do update set public = false;

drop policy if exists "deliveries_public_read" on storage.objects;
