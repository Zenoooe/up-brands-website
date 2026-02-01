-- Add backup_image_url to projects
alter table public.projects 
add column if not exists backup_image_url text;

-- Add backup_image_url to posts
alter table public.posts 
add column if not exists backup_image_url text;
