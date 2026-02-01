-- Create a public storage bucket for project images
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

-- Allow public read access to the bucket
create policy "Public Read Access"
on storage.objects for select
using ( bucket_id = 'project-images' );

-- Allow authenticated users (admins) to upload/update/delete
create policy "Admin Insert"
on storage.objects for insert
with check ( bucket_id = 'project-images' );

create policy "Admin Update"
on storage.objects for update
with check ( bucket_id = 'project-images' );

create policy "Admin Delete"
on storage.objects for delete
using ( bucket_id = 'project-images' );
