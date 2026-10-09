ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS "dribbbleLink" TEXT,
  ADD COLUMN IF NOT EXISTS "zcoolLink" TEXT,
  ADD COLUMN IF NOT EXISTS "gutianluLink" TEXT,
  ADD COLUMN IF NOT EXISTS "instagramLink" TEXT,
  ADD COLUMN IF NOT EXISTS "worldBrandSocietyLink" TEXT,
  ADD COLUMN IF NOT EXISTS "packagingOfTheWorldLink" TEXT,
  ADD COLUMN IF NOT EXISTS "abduzeedoLink" TEXT,
  ADD COLUMN IF NOT EXISTS "inspirationGridLink" TEXT;
-- Add platform link columns to public.projects
-- These fields are edited in the admin ProjectEditor and rendered by PlatformModal.
-- Missing columns caused inserts/updates to fail ("Failed to save project").

ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS "dribbbleLink" TEXT,
    ADD COLUMN IF NOT EXISTS "zcoolLink" TEXT,
    ADD COLUMN IF NOT EXISTS "gutianluLink" TEXT,
    ADD COLUMN IF NOT EXISTS "instagramLink" TEXT,
    ADD COLUMN IF NOT EXISTS "worldBrandSocietyLink" TEXT,
    ADD COLUMN IF NOT EXISTS "packagingOfTheWorldLink" TEXT,
    ADD COLUMN IF NOT EXISTS "abduzeedoLink" TEXT,
    ADD COLUMN IF NOT EXISTS "inspirationGridLink" TEXT;
