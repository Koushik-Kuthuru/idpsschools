-- Enable read access for authenticated portal users (teacher/student/admin).
-- Run once in Supabase SQL Editor or: supabase db execute -f supabase/rls_read_policies.sql

-- Schools & academic structure
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_schools" ON public.schools;
CREATE POLICY "auth_read_schools" ON public.schools FOR SELECT TO authenticated USING (true);

ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_academic_years" ON public.academic_years;
CREATE POLICY "auth_read_academic_years" ON public.academic_years FOR SELECT TO authenticated USING (true);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_grades" ON public.grades;
CREATE POLICY "auth_read_grades" ON public.grades FOR SELECT TO authenticated USING (true);

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_sections" ON public.sections;
CREATE POLICY "auth_read_sections" ON public.sections FOR SELECT TO authenticated USING (true);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_subjects" ON public.subjects;
CREATE POLICY "auth_read_subjects" ON public.subjects FOR SELECT TO authenticated USING (true);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_users" ON public.users;
CREATE POLICY "auth_read_users" ON public.users FOR SELECT TO authenticated USING (true);

-- Students & enrollments
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_students" ON public.students;
CREATE POLICY "auth_read_students" ON public.students FOR SELECT TO authenticated USING (true);

ALTER TABLE public.student_section_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_enrollments" ON public.student_section_enrollments;
CREATE POLICY "auth_read_enrollments" ON public.student_section_enrollments FOR SELECT TO authenticated USING (true);

-- Staff & teachers
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_staff" ON public.staff_profiles;
CREATE POLICY "auth_read_staff" ON public.staff_profiles FOR SELECT TO authenticated USING (true);

ALTER TABLE public.teacher_subject_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_tsa" ON public.teacher_subject_assignments;
CREATE POLICY "auth_read_tsa" ON public.teacher_subject_assignments FOR SELECT TO authenticated USING (true);

-- Attendance & homework (if tables exist)
DO $$ BEGIN
  ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "auth_read_attendance" ON public.attendance;
  CREATE POLICY "auth_read_attendance" ON public.attendance FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "auth_read_homework" ON public.homework;
  CREATE POLICY "auth_read_homework" ON public.homework FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "auth_read_materials" ON public.study_materials;
  CREATE POLICY "auth_read_materials" ON public.study_materials FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Allow users to update their own profile row
DROP POLICY IF EXISTS "auth_update_own_user" ON public.users;
CREATE POLICY "auth_update_own_user" ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
