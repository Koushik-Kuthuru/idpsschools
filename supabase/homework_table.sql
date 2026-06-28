-- Homework / assignments for teacher portal (legacy slug-based school_id)
CREATE TABLE IF NOT EXISTS public.homework (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    title TEXT NOT NULL,
    subject TEXT,
    grade TEXT,
    section TEXT,
    class_name TEXT,
    description TEXT,
    due_date DATE,
    assigned_date DATE DEFAULT CURRENT_DATE,
    due_at TIMESTAMPTZ,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'published',
    teacher_id TEXT,
    teacher_name TEXT,
    type TEXT DEFAULT 'homework',
    submissions_count INTEGER DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homework_school_id ON public.homework (school_id);
CREATE INDEX IF NOT EXISTS idx_homework_teacher_id ON public.homework (teacher_id);
