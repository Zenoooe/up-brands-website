
-- Allow public read access to projects
create policy "Allow public read"
  on public.projects
  for select
  to public
  using (true);

-- Allow public read access to posts
create policy "Allow public read"
  on public.posts
  for select
  to public
  using (true);
