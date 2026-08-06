-- 028_student_profile_placements.sql

-- Student Skills
CREATE TABLE IF NOT EXISTS public.student_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    proficiency_level TEXT DEFAULT 'intermediate' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Certificates
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    issuing_organization TEXT NOT NULL,
    issue_date DATE NOT NULL,
    credential_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Achievements & Badges
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    xp_bonus INTEGER DEFAULT 50 CHECK (xp_bonus >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

-- Experience / Internships
CREATE TABLE IF NOT EXISTS public.experience_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coding Roadmaps Progress
CREATE TABLE IF NOT EXISTS public.coding_roadmap_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    roadmap_name TEXT NOT NULL,
    completed_nodes JSONB DEFAULT '[]'::jsonb,
    progress_percentage NUMERIC(5, 2) DEFAULT 0.00 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_roadmap UNIQUE (student_id, roadmap_name)
);

-- Placement Status
CREATE TABLE IF NOT EXISTS public.placement_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'seeking' CHECK (status IN ('seeking', 'placed', 'higher_studies', 'entrepreneurship')),
    company_placed TEXT,
    package_lpa NUMERIC(6, 2) DEFAULT 0.00 CHECK (package_lpa >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Companies Applied
CREATE TABLE IF NOT EXISTS public.company_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    role TEXT NOT NULL,
    applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'interviewing', 'offered', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Interview Schedules
CREATE TABLE IF NOT EXISTS public.interview_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.company_applications(id) ON DELETE CASCADE,
    round_name TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    result TEXT DEFAULT 'pending' CHECK (result IN ('pending', 'passed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Job Offers
CREATE TABLE IF NOT EXISTS public.job_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.company_applications(id) ON DELETE CASCADE,
    package_lpa NUMERIC(6, 2) NOT NULL CHECK (package_lpa > 0),
    offer_letter_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skills_student_id ON public.student_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON public.certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_experience_student_id ON public.experience_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON public.company_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_placement_status_student ON public.placement_status(student_id);

-- RLS
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_roadmap_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read skills" ON public.student_skills FOR SELECT USING (true);
CREATE POLICY "Allow manage skills" ON public.student_skills FOR ALL USING (auth.uid() = student_id OR true);

CREATE POLICY "Allow read certificates" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Allow manage certificates" ON public.certificates FOR ALL USING (auth.uid() = student_id OR true);

CREATE POLICY "Allow read achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Allow read user_achievements" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "Allow insert user_achievements" ON public.user_achievements FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read experience" ON public.experience_entries FOR SELECT USING (true);
CREATE POLICY "Allow manage experience" ON public.experience_entries FOR ALL USING (auth.uid() = student_id OR true);

CREATE POLICY "Allow read roadmap" ON public.coding_roadmap_progress FOR SELECT USING (true);
CREATE POLICY "Allow manage roadmap" ON public.coding_roadmap_progress FOR ALL USING (auth.uid() = student_id OR true);

CREATE POLICY "Allow read placement_status" ON public.placement_status FOR SELECT USING (true);
CREATE POLICY "Allow manage placement_status" ON public.placement_status FOR ALL USING (auth.uid() = student_id OR true);

CREATE POLICY "Allow read applications" ON public.company_applications FOR SELECT USING (true);
CREATE POLICY "Allow manage applications" ON public.company_applications FOR ALL USING (auth.uid() = student_id OR true);

CREATE POLICY "Allow read interviews" ON public.interview_schedules FOR SELECT USING (true);
CREATE POLICY "Allow manage interviews" ON public.interview_schedules FOR ALL USING (true);

CREATE POLICY "Allow read job_offers" ON public.job_offers FOR SELECT USING (true);
CREATE POLICY "Allow manage job_offers" ON public.job_offers FOR ALL USING (true);
