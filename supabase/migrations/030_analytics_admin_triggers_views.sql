-- 030_analytics_admin_triggers_views.sql

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System Settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feature Flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_name TEXT UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read audit_logs for admins" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read system_settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Allow manage system_settings" ON public.system_settings FOR ALL USING (true);

CREATE POLICY "Allow read feature_flags" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "Allow manage feature_flags" ON public.feature_flags FOR ALL USING (true);

/* ========================================================================== */
/* AUTOMATED TRIGGERS & FUNCTIONS                                            */
/* ========================================================================== */

-- 1. Auto Update Updated_At Timestamp Function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
CREATE OR REPLACE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_problems_updated_at BEFORE UPDATE ON public.problems FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_contests_updated_at BEFORE UPDATE ON public.contests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Increment Solved Count & XP on Accepted Submissions Function
CREATE OR REPLACE FUNCTION public.handle_accepted_submission()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.verdict = 'ACCEPTED' THEN
        -- Record solved problem if not exists
        INSERT INTO public.solved_problems (user_id, problem_id)
        VALUES (NEW.user_id, NEW.problem_id)
        ON CONFLICT (user_id, problem_id) DO NOTHING;

        -- Award 50 XP to User
        UPDATE public.users
        SET xp = xp + 50, coins = coins + 10
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_submission_accepted AFTER INSERT ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.handle_accepted_submission();

/* ========================================================================== */
/* PRODUCTION SQL VIEWS                                                      */
/* ========================================================================== */

-- 1. Leaderboard View
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT 
    u.id AS user_id,
    u.full_name,
    u.username,
    u.profile_image,
    u.xp,
    u.level,
    u.coins,
    COUNT(DISTINCT sp.problem_id) AS solved_count,
    DENSE_RANK() OVER (ORDER BY u.xp DESC, COUNT(DISTINCT sp.problem_id) DESC) AS rank
FROM public.users u
LEFT JOIN public.solved_problems sp ON u.id = sp.user_id
GROUP BY u.id, u.full_name, u.username, u.profile_image, u.xp, u.level, u.coins;

-- 2. Student Dashboard View
CREATE OR REPLACE VIEW public.student_dashboard_view AS
SELECT 
    u.id AS student_id,
    u.full_name,
    u.email,
    u.roll_number,
    u.xp,
    u.level,
    COUNT(DISTINCT sp.problem_id) AS total_solved,
    COUNT(DISTINCT s.id) AS total_submissions
FROM public.users u
LEFT JOIN public.solved_problems sp ON u.id = sp.user_id
LEFT JOIN public.submissions s ON u.id = s.user_id
GROUP BY u.id, u.full_name, u.email, u.roll_number, u.xp, u.level;

-- 3. Problem Statistics View
CREATE OR REPLACE VIEW public.problem_statistics_view AS
SELECT 
    p.id AS problem_id,
    p.title,
    p.slug,
    p.difficulty,
    COUNT(s.id) AS total_submissions,
    COUNT(CASE WHEN s.verdict = 'ACCEPTED' THEN 1 END) AS accepted_submissions,
    CASE 
        WHEN COUNT(s.id) > 0 THEN ROUND((COUNT(CASE WHEN s.verdict = 'ACCEPTED' THEN 1 END)::NUMERIC / COUNT(s.id)::NUMERIC) * 100, 2)
        ELSE 0.00
    END AS calculated_acceptance_rate
FROM public.problems p
LEFT JOIN public.submissions s ON p.id = s.problem_id
GROUP BY p.id, p.title, p.slug, p.difficulty;
