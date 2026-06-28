-- Study materials uploaded by teachers (legacy slug-based school_id)
CREATE TABLE IF NOT EXISTS public.study_materials (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade TEXT,
    section TEXT,
    class_name TEXT,
    material_type TEXT DEFAULT 'notes',
    description TEXT,
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    external_link TEXT,
    status TEXT DEFAULT 'published',
    teacher_id TEXT,
    teacher_name TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_materials_school_id ON public.study_materials (school_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_teacher_id ON public.study_materials (teacher_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_class ON public.study_materials (school_id, grade, section);
