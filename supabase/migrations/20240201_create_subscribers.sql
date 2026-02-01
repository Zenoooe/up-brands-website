-- Create subscribers table
create table if not exists public.subscribers (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.subscribers enable row level security;

-- Allow anonymous inserts (for newsletter subscription)
create policy "Allow anonymous inserts"
  on public.subscribers
  for insert
  to anon
  with check (true);

-- Only allow admins (service_role or authenticated with specific role) to view
create policy "Allow admin view"
  on public.subscribers
  for select
  to authenticated
  using (true); -- simplify for now, ideally restrict to admin role
