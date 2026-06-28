-- Teacher self-service tables (legacy slug-based school_id)

CREATE TABLE IF NOT EXISTS public.staff_expenses (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    employee_name TEXT,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Reimbursement',
    amount NUMERIC NOT NULL DEFAULT 0,
    expense_date DATE,
    status TEXT DEFAULT 'Pending',
    vendor TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staff_complaints (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    employee_name TEXT,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'Open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_expenses_school_employee ON public.staff_expenses (school_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_complaints_school_employee ON public.staff_complaints (school_id, employee_id);
