ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Create a unique index on slug, but allow nulls (though we ideally want them unique if present)
CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_idx ON public.projects (slug) WHERE slug IS NOT NULL;
