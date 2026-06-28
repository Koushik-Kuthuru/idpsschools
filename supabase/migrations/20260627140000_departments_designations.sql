-- Branch-scoped departments and designations (separate tables)

CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    hod_name TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT departments_branch_slug_unique UNIQUE (branch_id, slug),
    CONSTRAINT departments_branch_name_unique UNIQUE (branch_id, name)
);

CREATE INDEX IF NOT EXISTS departments_branch_id_idx ON public.departments (branch_id);

CREATE TABLE IF NOT EXISTS public.designations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT designations_department_slug_unique UNIQUE (department_id, slug),
    CONSTRAINT designations_department_name_unique UNIQUE (department_id, name)
);

CREATE INDEX IF NOT EXISTS designations_branch_id_idx ON public.designations (branch_id);
CREATE INDEX IF NOT EXISTS designations_department_id_idx ON public.designations (department_id);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS departments_select_authenticated ON public.departments;
DROP POLICY IF EXISTS designations_select_authenticated ON public.designations;

-- Service role (admin API) bypasses RLS. Authenticated read for branch staff UI if needed later.
CREATE POLICY departments_select_authenticated ON public.departments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY designations_select_authenticated ON public.designations
    FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.departments TO authenticated;
GRANT SELECT ON public.designations TO authenticated;
GRANT ALL ON public.departments TO service_role;
GRANT ALL ON public.designations TO service_role;

COMMENT ON TABLE public.departments IS 'HR departments per branch (slug exposed to UI as id).';
COMMENT ON TABLE public.designations IS 'Designations linked to a department per branch.';
