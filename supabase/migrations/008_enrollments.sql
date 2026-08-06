-- 008_enrollments.sql

-- Student-Class Enrollments
CREATE TABLE IF NOT EXISTS public.student_class_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_class UNIQUE (student_id, class_id)
);

-- Teacher-Subject Assignments
CREATE TABLE IF NOT EXISTS public.teacher_subject_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_teacher_subject_class UNIQUE (teacher_id, subject_id, class_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id ON public.student_class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_class_id ON public.student_class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_id ON public.teacher_subject_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class_id ON public.teacher_subject_assignments(class_id);

-- RLS
ALTER TABLE public.student_class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subject_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read enrollments" ON public.student_class_enrollments FOR SELECT USING (true);
CREATE POLICY "Allow manage enrollments" ON public.student_class_enrollments FOR ALL USING (true);

CREATE POLICY "Allow read assignments" ON public.teacher_subject_assignments FOR SELECT USING (true);
CREATE POLICY "Allow manage assignments" ON public.teacher_subject_assignments FOR ALL USING (true);
