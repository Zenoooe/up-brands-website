
-- Add is_visible column to projects table
alter table public.projects 
add column if not exists is_visible boolean default true;

-- Update existing records to have is_visible = true (though default handles new ones, this ensures existing nulls are set if any)
update public.projects 
set is_visible = true 
where is_visible is null;
