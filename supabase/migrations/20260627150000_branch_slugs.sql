-- Stable URL slugs for branches (idpscherukupalli, idpskalaburagi)

ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE public.branches
SET slug = 'idpscherukupalli'
WHERE slug IS NULL AND name ILIKE '%cherukupalli%';

UPDATE public.branches
SET slug = 'idpskalaburagi'
WHERE slug IS NULL AND name ILIKE '%kalaburagi%';

CREATE UNIQUE INDEX IF NOT EXISTS branches_slug_unique ON public.branches (slug)
  WHERE slug IS NOT NULL;

COMMENT ON COLUMN public.branches.slug IS 'App route slug, e.g. idpscherukupalli';
