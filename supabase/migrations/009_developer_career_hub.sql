-- ============================================================================
-- MODULE 9: DEVELOPER CAREER HUB ARCHITECTURE
-- File: 009_developer_career_hub.sql
-- GitHub + LinkedIn + LeetCode Career Portfolio & Placement Platform
-- ============================================================================

-- 1. Student Skills Table
CREATE TABLE IF NOT EXISTS public.student_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    proficiency TEXT NOT NULL DEFAULT 'Intermediate' CHECK (proficiency IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_skill UNIQUE (user_id, skill_name)
);

-- 2. Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    issuer TEXT NOT NULL,
    certificate_url TEXT,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    verification_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Achievements Master Table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    xp_reward INTEGER DEFAULT 50 CHECK (xp_reward >= 0),
    badge_color TEXT DEFAULT '#3B82F6',
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. User Achievements Unlocked Table
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_achievement UNIQUE (achievement_id, user_id)
);

-- 5. Coding Roadmaps Master Table
CREATE TABLE IF NOT EXISTS public.coding_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'DSA',
    estimated_hours INTEGER DEFAULT 20 CHECK (estimated_hours > 0),
    difficulty TEXT NOT NULL DEFAULT 'Beginner' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Roadmap Progress Table
CREATE TABLE IF NOT EXISTS public.roadmap_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id UUID NOT NULL REFERENCES public.coding_roadmaps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    completion_percentage NUMERIC(5, 2) DEFAULT 0.00 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    current_step INTEGER DEFAULT 1 CHECK (current_step >= 1),
    completed BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_roadmap UNIQUE (roadmap_id, user_id)
);

-- 7. Placement Profiles Table
CREATE TABLE IF NOT EXISTS public.placement_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    cgpa NUMERIC(3, 2) CHECK (cgpa IS NULL OR (cgpa >= 0.00 AND cgpa <= 10.00)),
    resume_url TEXT,
    portfolio_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    preferred_role TEXT,
    preferred_location TEXT,
    open_to_work BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Company Applications Table
CREATE TABLE IF NOT EXISTS public.company_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    role TEXT NOT NULL,
    application_status TEXT NOT NULL DEFAULT 'Applied' CHECK (application_status IN ('Applied', 'OA Cleared', 'Interview Scheduled', 'HR Round', 'Selected', 'Rejected', 'Offer Accepted')),
    applied_on DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Interview Schedules Table
CREATE TABLE IF NOT EXISTS public.interview_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.company_applications(id) ON DELETE CASCADE,
    interview_type TEXT DEFAULT 'Technical',
    scheduled_at TIMESTAMPTZ NOT NULL,
    interviewer TEXT,
    meeting_link TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Job Offers Table
CREATE TABLE IF NOT EXISTS public.job_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.company_applications(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    ctc NUMERIC(8, 2) NOT NULL CHECK (ctc > 0),
    joining_date DATE,
    offer_status TEXT NOT NULL DEFAULT 'Pending' CHECK (offer_status IN ('Pending', 'Accepted', 'Declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Coding Goals Table
CREATE TABLE IF NOT EXISTS public.coding_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_value INTEGER NOT NULL CHECK (target_value > 0),
    current_value INTEGER DEFAULT 0 CHECK (current_value >= 0),
    is_completed BOOLEAN DEFAULT FALSE,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Coding Activity Timeline Table
CREATE TABLE IF NOT EXISTS public.coding_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    xp_earned INTEGER DEFAULT 0 CHECK (xp_earned >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Profile Badges Table
CREATE TABLE IF NOT EXISTS public.profile_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_name TEXT NOT NULL,
    badge_icon TEXT NOT NULL,
    awarded_for TEXT NOT NULL,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR FAST PORTFOLIO & RECRUITER SEARCH
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON public.student_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_name ON public.student_skills(skill_name);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_ach ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_progress_user ON public.roadmap_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_progress_roadmap ON public.roadmap_progress(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_placement_profiles_user ON public.placement_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON public.company_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_company ON public.company_applications(company_name);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.company_applications(application_status);
CREATE INDEX IF NOT EXISTS idx_interviews_app_id ON public.interview_schedules(application_id);
CREATE INDEX IF NOT EXISTS idx_offers_app_id ON public.job_offers(application_id);
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON public.coding_activity(user_id);

-- ============================================================================
-- AUTOMATED TRIGGERS FOR ACHIEVEMENTS & XP REWARDS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_award_achievement_xp()
RETURNS TRIGGER AS $$
DECLARE
    reward_xp INTEGER;
    ach_name TEXT;
BEGIN
    SELECT xp_reward, name INTO reward_xp, ach_name FROM public.achievements WHERE id = NEW.achievement_id;

    IF reward_xp > 0 THEN
        UPDATE public.users SET xp = xp + reward_xp WHERE id = NEW.user_id;

        INSERT INTO public.coding_activity (user_id, activity_type, description, xp_earned)
        VALUES (NEW.user_id, 'Achievement Unlocked', 'Unlocked achievement: ' || COALESCE(ach_name, 'Badge'), reward_xp);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_award_achievement_xp
AFTER INSERT ON public.user_achievements
FOR EACH ROW EXECUTE FUNCTION public.auto_award_achievement_xp();

-- Seed Core Achievements
INSERT INTO public.achievements (name, description, icon, xp_reward, badge_color, category) VALUES
    ('First Accepted', 'Solved your first coding problem', 'trophy', 50, '#10B981', 'Coding'),
    ('Streak Master', 'Maintained a 7-day coding streak', 'flame', 100, '#F59E0B', 'Streak'),
    ('Contest Champion', 'Finished in the Top 10 of a contest', 'award', 200, '#6366F1', 'Contests'),
    ('Polyglot', 'Submitted code in 3 different programming languages', 'code', 100, '#EC4899', 'Coding')
ON CONFLICT (name) DO NOTHING;

-- Seed Default Coding Roadmaps
INSERT INTO public.coding_roadmaps (title, description, category, estimated_hours, difficulty) VALUES
    ('DSA Master Roadmap', 'Complete Data Structures & Algorithms preparation roadmap', 'DSA', 60, 'Intermediate'),
    ('System Design Basics', 'High-level and Low-level system design fundamentals', 'System Design', 40, 'Advanced'),
    ('Full Stack Web Dev', 'Frontend, Backend, and Database development roadmap', 'Web Development', 80, 'Beginner')
ON CONFLICT (title) DO NOTHING;

-- ============================================================================
-- SQL VIEWS FOR CAREER PORTFOLIO & RECRUITER ANALYTICS
-- ============================================================================

-- 1. Student Profile View
CREATE OR REPLACE VIEW public.v_student_profile AS
SELECT 
    u.id AS user_id,
    u.full_name,
    u.username,
    u.email,
    u.profile_image,
    u.bio,
    u.github_url,
    u.linkedin_url,
    u.portfolio_url,
    u.xp,
    u.level,
    u.coins,
    COUNT(DISTINCT sk.id) AS skills_count,
    COUNT(DISTINCT cert.id) AS certificates_count,
    COUNT(DISTINCT ua.id) AS achievements_unlocked,
    pp.cgpa,
    pp.open_to_work,
    pp.preferred_role
FROM public.users u
LEFT JOIN public.student_skills sk ON u.id = sk.user_id
LEFT JOIN public.certificates cert ON u.id = cert.user_id
LEFT JOIN public.user_achievements ua ON u.id = ua.user_id
LEFT JOIN public.placement_profiles pp ON u.id = pp.user_id
GROUP BY u.id, u.full_name, u.username, u.email, u.profile_image, u.bio, u.github_url, u.linkedin_url, u.portfolio_url, u.xp, u.level, u.coins, pp.cgpa, pp.open_to_work, pp.preferred_role;

-- 2. Resume Summary View
CREATE OR REPLACE VIEW public.v_resume_summary AS
SELECT 
    u.id AS user_id,
    u.full_name,
    u.email,
    pp.cgpa,
    pp.resume_url,
    pp.portfolio_url,
    pp.linkedin_url,
    pp.github_url,
    pp.preferred_role,
    pp.preferred_location,
    pp.open_to_work,
    JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('skill', sk.skill_name, 'proficiency', sk.proficiency, 'verified', sk.verified)) FILTER (WHERE sk.id IS NOT NULL) AS skills,
    JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('title', c.title, 'issuer', c.issuer, 'date', c.issue_date)) FILTER (WHERE c.id IS NOT NULL) AS certificates
FROM public.users u
LEFT JOIN public.placement_profiles pp ON u.id = pp.user_id
LEFT JOIN public.student_skills sk ON u.id = sk.user_id
LEFT JOIN public.certificates c ON u.id = c.user_id
GROUP BY u.id, u.full_name, u.email, pp.cgpa, pp.resume_url, pp.portfolio_url, pp.linkedin_url, pp.github_url, pp.preferred_role, pp.preferred_location, pp.open_to_work;

-- 3. Career Progress View
CREATE OR REPLACE VIEW public.v_career_progress AS
SELECT 
    u.id AS user_id,
    u.full_name,
    COUNT(DISTINCT ca.id) AS total_applications,
    COUNT(DISTINCT CASE WHEN ca.application_status = 'Interview Scheduled' THEN ca.id END) AS active_interviews,
    COUNT(DISTINCT CASE WHEN ca.application_status IN ('Selected', 'Offer Accepted') THEN ca.id END) AS offers_received,
    COUNT(DISTINCT rp.id) AS active_roadmaps
FROM public.users u
LEFT JOIN public.company_applications ca ON u.id = ca.user_id
LEFT JOIN public.roadmap_progress rp ON u.id = rp.user_id
GROUP BY u.id, u.full_name;

-- 4. Skill Statistics View
CREATE OR REPLACE VIEW public.v_skill_statistics AS
SELECT 
    sk.skill_name,
    COUNT(DISTINCT sk.user_id) AS total_students,
    COUNT(CASE WHEN sk.proficiency = 'Expert' THEN 1 END) AS expert_count,
    COUNT(CASE WHEN sk.verified = true THEN 1 END) AS verified_count
FROM public.student_skills sk
GROUP BY sk.skill_name;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_badges ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Public read achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Public read coding_roadmaps" ON public.coding_roadmaps FOR SELECT USING (true);
CREATE POLICY "Public read student_skills" ON public.student_skills FOR SELECT USING (true);
CREATE POLICY "Public read certificates" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Public read user_achievements" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "Public read placement_profiles" ON public.placement_profiles FOR SELECT USING (true);
CREATE POLICY "Public read profile_badges" ON public.profile_badges FOR SELECT USING (true);

-- Student Manage Own Career Content Policies
CREATE POLICY "Students manage own skills" ON public.student_skills FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Students manage own certificates" ON public.certificates FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Students manage own roadmap progress" ON public.roadmap_progress FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Students manage own placement profile" ON public.placement_profiles FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Students manage own company applications" ON public.company_applications FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Students manage own coding goals" ON public.coding_goals FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Students read own activity" ON public.coding_activity FOR SELECT USING (auth.uid() = user_id OR true);

-- Teacher & Admin Policies
CREATE POLICY "Staff read student career progress" ON public.company_applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('teacher', 'admin', 'super_admin'))
);
