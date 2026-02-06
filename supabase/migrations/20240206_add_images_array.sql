
-- Add images array column to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Update existing rows to initialize images array with the main imageUrl if empty
UPDATE public.projects 
SET images = ARRAY["imageUrl"]
WHERE images IS NULL OR array_length(images, 1) IS NULL;
