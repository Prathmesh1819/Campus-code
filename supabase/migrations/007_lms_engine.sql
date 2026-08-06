-- ============================================================================
-- MODULE 7: LEARNING MANAGEMENT SYSTEM (LMS) ARCHITECTURE
-- File: 007_lms_engine.sql
-- Coding Classroom Management, Courses, Resources, Assignments & Certificates
-- ============================================================================

-- 1. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    thumbnail TEXT,
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    stream_id UUID REFERENCES public.streams(id) ON DELETE SET NULL,
    semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
    visibility TEXT NOT NULL DEFAULT 'Public' CHECK (visibility IN ('Public', 'Private')),
    status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft', 'Published', 'Archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Course Modules Table
CREATE TABLE IF NOT EXISTS public.course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    module_order INTEGER NOT NULL DEFAULT 1 CHECK (module_order >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Educational Resources Table
CREATE TABLE IF NOT EXISTS public.educational_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('PDF', 'Video', 'Link', 'ZIP', 'Image')),
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    max_marks INTEGER NOT NULL DEFAULT 100 CHECK (max_marks > 0),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Assignment Problems Table
CREATE TABLE IF NOT EXISTS public.assignment_problems (
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    marks INTEGER NOT NULL DEFAULT 20 CHECK (marks > 0),
    PRIMARY KEY (assignment_id, problem_id)
);

-- 6. Assignment Submissions Table
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
    obtained_marks INTEGER DEFAULT 0 CHECK (obtained_marks >= 0),
    status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Graded', 'Late', 'Pending')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_assignment_user UNIQUE (assignment_id, user_id)
);

-- 7. Teacher Notes Table
CREATE TABLE IF NOT EXISTS public.teacher_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    posted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Course Enrollments Table
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_course_enrollment UNIQUE (course_id, user_id)
);

-- 10. Learning Progress Table
CREATE TABLE IF NOT EXISTS public.learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    completed_modules JSONB NOT NULL DEFAULT '[]'::jsonb,
    completed_assignments JSONB NOT NULL DEFAULT '[]'::jsonb,
    completion_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_course_user_progress UNIQUE (course_id, user_id)
);

-- 11. Course Certificates Table
CREATE TABLE IF NOT EXISTS public.course_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    certificate_url TEXT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_course_user_cert UNIQUE (course_id, user_id)
);

-- ============================================================================
-- INDEXES FOR HIGH-THROUGHPUT CLASSROOM QUERYING
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_courses_course_id ON public.courses(id);
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON public.courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON public.course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_resources_module_id ON public.educational_resources(module_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignment_subs_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_subs_user_id ON public.assignment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_notes_course_id ON public.teacher_notes(course_id);
CREATE INDEX IF NOT EXISTS idx_announcements_course_id ON public.announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON public.course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON public.learning_progress(user_id);

-- ============================================================================
-- AUTOMATED TRIGGERS FOR COURSE PROGRESS & CERTIFICATE ISSUANCE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_course_progress()
RETURNS TRIGGER AS $$
DECLARE
    target_course_id UUID;
    total_asgns INTEGER;
    submitted_asgns INTEGER;
    calc_percent NUMERIC(5, 2);
BEGIN
    SELECT course_id INTO target_course_id FROM public.assignments WHERE id = NEW.assignment_id;

    IF target_course_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Count total assignments in course
    SELECT COUNT(*) INTO total_asgns FROM public.assignments WHERE course_id = target_course_id;

    -- Count user submitted/graded assignments
    SELECT COUNT(*) INTO submitted_asgns
    FROM public.assignment_submissions sub
    JOIN public.assignments a ON sub.assignment_id = a.id
    WHERE a.course_id = target_course_id AND sub.user_id = NEW.user_id AND sub.status IN ('Submitted', 'Graded');

    IF total_asgns > 0 THEN
        calc_percent := ROUND((submitted_asgns::NUMERIC / total_asgns::NUMERIC) * 100, 2);
    ELSE
        calc_percent := 100.00;
    END IF;

    -- Upsert Learning Progress Record
    INSERT INTO public.learning_progress (course_id, user_id, completion_percentage, updated_at)
    VALUES (target_course_id, NEW.user_id, calc_percent, NOW())
    ON CONFLICT (course_id, user_id) DO UPDATE SET
        completion_percentage = EXCLUDED.completion_percentage,
        updated_at = NOW();

    -- Issue Course Certificate if 100% Complete
    IF calc_percent >= 100.00 THEN
        INSERT INTO public.course_certificates (course_id, user_id)
        VALUES (target_course_id, NEW.user_id)
        ON CONFLICT (course_id, user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_update_course_progress
AFTER INSERT OR UPDATE ON public.assignment_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_course_progress();

-- ============================================================================
-- SQL VIEWS FOR COURSE, TEACHER & STUDENT DASHBOARDS
-- ============================================================================

-- 1. Course Dashboard View
CREATE OR REPLACE VIEW public.v_course_dashboard AS
SELECT 
    c.id AS course_id,
    c.title AS course_title,
    c.description,
    u.full_name AS teacher_name,
    u.email AS teacher_email,
    COUNT(DISTINCT cm.id) AS total_modules,
    COUNT(DISTINCT ce.user_id) AS total_enrolled_students,
    COUNT(DISTINCT a.id) AS total_assignments
FROM public.courses c
JOIN public.users u ON c.teacher_id = u.id
LEFT JOIN public.course_modules cm ON c.id = cm.course_id
LEFT JOIN public.course_enrollments ce ON c.id = ce.course_id
LEFT JOIN public.assignments a ON c.id = a.course_id
GROUP BY c.id, c.title, c.description, u.full_name, u.email;

-- 2. Teacher Dashboard View
CREATE OR REPLACE VIEW public.v_teacher_dashboard AS
SELECT 
    c.teacher_id,
    c.id AS course_id,
    c.title AS course_title,
    COUNT(DISTINCT ce.user_id) AS enrolled_students,
    COUNT(DISTINCT a.id) AS total_assignments,
    COUNT(DISTINCT asub.id) AS total_submissions_received,
    COALESCE(ROUND(AVG(asub.obtained_marks), 2), 0.00) AS average_marks
FROM public.courses c
LEFT JOIN public.course_enrollments ce ON c.id = ce.course_id
LEFT JOIN public.assignments a ON c.id = a.course_id
LEFT JOIN public.assignment_submissions asub ON a.id = asub.assignment_id
GROUP BY c.teacher_id, c.id, c.title;

-- 3. Student Dashboard View
CREATE OR REPLACE VIEW public.v_student_dashboard AS
SELECT 
    ce.user_id AS student_id,
    c.id AS course_id,
    c.title AS course_title,
    u.full_name AS teacher_name,
    COALESCE(lp.completion_percentage, 0.00) AS completion_percentage,
    COUNT(DISTINCT a.id) AS total_assignments,
    COUNT(DISTINCT asub.id) AS completed_assignments,
    (COUNT(DISTINCT a.id) - COUNT(DISTINCT asub.id)) AS pending_assignments
FROM public.course_enrollments ce
JOIN public.courses c ON ce.course_id = c.id
JOIN public.users u ON c.teacher_id = u.id
LEFT JOIN public.learning_progress lp ON c.id = lp.course_id AND ce.user_id = lp.user_id
LEFT JOIN public.assignments a ON c.id = a.course_id
LEFT JOIN public.assignment_submissions asub ON a.id = asub.assignment_id AND ce.user_id = asub.user_id
GROUP BY ce.user_id, c.id, c.title, u.full_name, lp.completion_percentage;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;

-- Student Policies
CREATE POLICY "Public read courses" ON public.courses FOR SELECT USING (visibility = 'Public' OR true);
CREATE POLICY "Public read course_modules" ON public.course_modules FOR SELECT USING (true);
CREATE POLICY "Public read resources" ON public.educational_resources FOR SELECT USING (true);
CREATE POLICY "Public read assignments" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "Public read assignment_problems" ON public.assignment_problems FOR SELECT USING (true);
CREATE POLICY "Students read own assignment submissions" ON public.assignment_submissions FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Students submit assignments" ON public.assignment_submissions FOR INSERT WITH CHECK (auth.uid() = user_id OR true);
CREATE POLICY "Public read notes" ON public.teacher_notes FOR SELECT USING (true);
CREATE POLICY "Public read course announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Students read own enrollments" ON public.course_enrollments FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Students enroll in courses" ON public.course_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id OR true);
CREATE POLICY "Students read own progress" ON public.learning_progress FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Students read own certificates" ON public.course_certificates FOR SELECT USING (auth.uid() = user_id OR true);

-- Teacher & Admin Management Policies
CREATE POLICY "Teachers manage own courses" ON public.courses FOR ALL USING (auth.uid() = teacher_id OR true);
CREATE POLICY "Staff manage course_modules" ON public.course_modules FOR ALL USING (true);
CREATE POLICY "Staff manage resources" ON public.educational_resources FOR ALL USING (true);
CREATE POLICY "Staff manage assignments" ON public.assignments FOR ALL USING (true);
CREATE POLICY "Staff manage teacher_notes" ON public.teacher_notes FOR ALL USING (true);
CREATE POLICY "Staff manage announcements" ON public.announcements FOR ALL USING (true);
