-- Drop existing policies to be clean
drop policy if exists "Allow anonymous inserts" on public.subscribers;
drop policy if exists "Allow admin view" on public.subscribers;

-- Policy: Allow anyone to insert (subscribe)
-- Using 'public' role covers both 'anon' and 'authenticated'
create policy "Allow public inserts"
  on public.subscribers
  for insert
  to public
  with check (true);

-- Policy: Allow authenticated users (admins) to view subscribers
create policy "Allow admin view"
  on public.subscribers
  for select
  to authenticated
  using (true);

-- Policy: Allow authenticated users (admins) to delete subscribers
create policy "Allow admin delete"
  on public.subscribers
  for delete
  to authenticated
  using (true);
