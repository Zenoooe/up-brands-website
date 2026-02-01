
-- Add sort_order and is_visible columns to posts table
alter table public.posts
add column if not exists sort_order integer default 0,
add column if not exists is_visible boolean default true;

-- Update existing records to have is_visible = true
update public.posts
set is_visible = true
where is_visible is null;
