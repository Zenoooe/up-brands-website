-- Remove Supabase backup URLs to free up storage dependency
UPDATE public.projects
SET backup_image_url = NULL
WHERE backup_image_url LIKE '%supabase.co%';
