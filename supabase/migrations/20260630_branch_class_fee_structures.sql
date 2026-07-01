-- Per-class month-wise fee grids (Class Fee Structure settings + imports)
CREATE TABLE IF NOT EXISTS public.branch_class_fee_structures (
    id TEXT NOT NULL,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    grade TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    fee_grid JSONB NOT NULL DEFAULT '[]'::jsonb,
    remarks TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, branch_id),
    UNIQUE (branch_id, grade, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_branch_class_fee_structures_branch_year
    ON public.branch_class_fee_structures (branch_id, academic_year);

ALTER TABLE public.branch_class_fee_structures ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.branch_class_fee_structures TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branch_class_fee_structures TO authenticated;

CREATE POLICY "branch_class_fee_structures_read"
    ON public.branch_class_fee_structures FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "branch_class_fee_structures_write"
    ON public.branch_class_fee_structures FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
