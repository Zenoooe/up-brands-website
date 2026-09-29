-- Allow authenticated admins to manage chat leads from the dashboard
drop policy if exists "Allow admin delete on leads" on public.leads;

create policy "Allow admin delete on leads"
  on public.leads
  for delete
  to authenticated
  using (true);
