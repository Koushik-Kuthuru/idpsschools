-- Extended student profile fields (photos, parents, fees, transport, etc.)
-- Run in Supabase SQL editor if not applied via CLI:
--   ALTER TABLE public.students ADD COLUMN IF NOT EXISTS profile_data jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS profile_data jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.students.profile_data IS 'Extended per-student profile JSON (parents, health, fees, transport, documents).';
