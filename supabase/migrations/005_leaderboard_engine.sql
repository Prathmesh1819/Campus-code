-- ============================================================================
-- MODULE 5: LEADERBOARD & RANKING ENGINE ARCHITECTURE
-- File: 005_leaderboard_engine.sql
-- Single Source of Truth Leaderboard Scores, Ratings, Snapshots & SQL Views
-- ============================================================================

-- 1. Leaderboard Scores Table (Single Source of Truth)
CREATE TABLE IF NOT EXISTS public.leaderboard_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    total_xp INTEGER DEFAULT 0 CHECK (total_xp >= 0),
    total_score INTEGER DEFAULT 0 CHECK (total_score >= 0),
    problems_solved INTEGER DEFAULT 0 CHECK (problems_solved >= 0),
    easy_solved INTEGER DEFAULT 0 CHECK (easy_solved >= 0),
    medium_solved INTEGER DEFAULT 0 CHECK (medium_solved >= 0),
    hard_solved INTEGER DEFAULT 0 CHECK (hard_solved >= 0),
    contests_participated INTEGER DEFAULT 0 CHECK (contests_participated >= 0),
    contests_won INTEGER DEFAULT 0 CHECK (contests_won >= 0),
    acceptance_rate NUMERIC(5, 2) DEFAULT 0.00 CHECK (acceptance_rate >= 0 AND acceptance_rate <= 100),
    current_rating INTEGER DEFAULT 1500 CHECK (current_rating >= 0),
    last_submission_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. User Ratings Table
CREATE TABLE IF NOT EXISTS public.user_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    current_rating INTEGER DEFAULT 1500 CHECK (current_rating >= 0),
    highest_rating INTEGER DEFAULT 1500 CHECK (highest_rating >= 0),
    rating_tier TEXT NOT NULL DEFAULT 'Candidate Master',
    rating_points INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Leaderboard Snapshots Table (Archived Periodic Standings)
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_type TEXT NOT NULL CHECK (snapshot_type IN ('weekly', 'monthly', 'contest', 'yearly')),
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL CHECK (rank >= 1),
    score INTEGER DEFAULT 0 CHECK (score >= 0),
    rating INTEGER DEFAULT 1500 CHECK (rating >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR HIGH-THROUGHPUT REAL-TIME RANKING
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_lb_scores_user_id ON public.leaderboard_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_lb_scores_current_rating ON public.leaderboard_scores(current_rating DESC);
CREATE INDEX IF NOT EXISTS idx_lb_scores_total_score ON public.leaderboard_scores(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_lb_scores_total_xp ON public.leaderboard_scores(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_lb_scores_last_sub ON public.leaderboard_scores(last_submission_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_ratings_user_id ON public.user_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_lb_snapshots_date ON public.leaderboard_snapshots(snapshot_type, snapshot_date);

-- ============================================================================
-- AUTOMATED TRIGGERS TO MAINTAIN SINGLE SOURCE LEADERBOARD SCORES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_leaderboard_scores()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    usr_xp INTEGER;
    usr_solved_cnt INTEGER;
    usr_easy INTEGER;
    usr_medium INTEGER;
    usr_hard INTEGER;
    usr_total_subs INTEGER;
    usr_accepted_subs INTEGER;
    usr_acc_rate NUMERIC(5, 2);
    latest_sub_time TIMESTAMPTZ;
BEGIN
    -- Determine target user_id based on triggering table
    IF TG_TABLE_NAME = 'users' THEN
        target_user_id := NEW.id;
    ELSIF TG_TABLE_NAME = 'submissions' THEN
        target_user_id := NEW.user_id;
    ELSIF TG_TABLE_NAME = 'solved_problems' THEN
        target_user_id := NEW.user_id;
    END IF;

    IF target_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Fetch user details & stats
    SELECT xp INTO usr_xp FROM public.users WHERE id = target_user_id;
    SELECT COUNT(*) INTO usr_solved_cnt FROM public.solved_problems WHERE user_id = target_user_id;

    SELECT 
        COUNT(CASE WHEN p.difficulty = 'EASY' THEN 1 END),
        COUNT(CASE WHEN p.difficulty = 'MEDIUM' THEN 1 END),
        COUNT(CASE WHEN p.difficulty = 'HARD' THEN 1 END)
    INTO usr_easy, usr_medium, usr_hard
    FROM public.solved_problems sp
    JOIN public.problems p ON sp.problem_id = p.id
    WHERE sp.user_id = target_user_id;

    SELECT COUNT(*), COUNT(CASE WHEN verdict = 'ACCEPTED' THEN 1 END), MAX(submitted_at)
    INTO usr_total_subs, usr_accepted_subs, latest_sub_time
    FROM public.submissions WHERE user_id = target_user_id;

    IF usr_total_subs > 0 THEN
        usr_acc_rate := ROUND((usr_accepted_subs::NUMERIC / usr_total_subs::NUMERIC) * 100, 2);
    ELSE
        usr_acc_rate := 0.00;
    END IF;

    -- Upsert Leaderboard Scores Single Source of Truth
    INSERT INTO public.leaderboard_scores (
        user_id, total_xp, total_score, problems_solved, easy_solved, medium_solved, hard_solved,
        acceptance_rate, last_submission_at, updated_at
    )
    VALUES (
        target_user_id, COALESCE(usr_xp, 0), (COALESCE(usr_xp, 0) + (usr_solved_cnt * 10)),
        usr_solved_cnt, usr_easy, usr_medium, usr_hard, usr_acc_rate, latest_sub_time, NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_xp = EXCLUDED.total_xp,
        total_score = EXCLUDED.total_score,
        problems_solved = EXCLUDED.problems_solved,
        easy_solved = EXCLUDED.easy_solved,
        medium_solved = EXCLUDED.medium_solved,
        hard_solved = EXCLUDED.hard_solved,
        acceptance_rate = EXCLUDED.acceptance_rate,
        last_submission_at = COALESCE(EXCLUDED.last_submission_at, public.leaderboard_scores.last_submission_at),
        updated_at = NOW();

    -- Ensure User Ratings Record Exists
    INSERT INTO public.user_ratings (user_id)
    VALUES (target_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Sync Triggers
CREATE OR REPLACE TRIGGER trg_sync_lb_users AFTER INSERT OR UPDATE OF xp ON public.users FOR EACH ROW EXECUTE FUNCTION public.sync_leaderboard_scores();
CREATE OR REPLACE TRIGGER trg_sync_lb_subs AFTER INSERT OR UPDATE OF verdict ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.sync_leaderboard_scores();
CREATE OR REPLACE TRIGGER trg_sync_lb_solved AFTER INSERT ON public.solved_problems FOR EACH ROW EXECUTE FUNCTION public.sync_leaderboard_scores();

-- ============================================================================
-- DYNAMIC LEADERBOARD SQL VIEWS (RANKING RULES ENFORCED)
-- Priority: 1. Total XP -> 2. Problems Solved -> 3. Acceptance Rate -> 4. Current Rating -> 5. Latest Submission
-- ============================================================================

-- 1. Global Leaderboard View
CREATE OR REPLACE VIEW public.v_global_leaderboard AS
SELECT 
    u.id AS user_id,
    u.full_name,
    u.username,
    u.profile_image,
    u.roll_number,
    ls.total_xp,
    ls.total_score,
    ls.problems_solved,
    ls.easy_solved,
    ls.medium_solved,
    ls.hard_solved,
    ls.acceptance_rate,
    ls.current_rating,
    ls.last_submission_at,
    DENSE_RANK() OVER (
        ORDER BY ls.total_xp DESC, ls.problems_solved DESC, ls.acceptance_rate DESC, ls.current_rating DESC, ls.last_submission_at DESC NULLS LAST
    ) AS rank
FROM public.users u
JOIN public.leaderboard_scores ls ON u.id = ls.user_id;

-- 2. College Leaderboard View
CREATE OR REPLACE VIEW public.v_college_leaderboard AS
SELECT 
    u.id AS user_id,
    u.full_name,
    u.username,
    u.department_id,
    u.stream_id,
    u.class_id,
    u.semester_id,
    ls.total_xp,
    ls.total_score,
    ls.problems_solved,
    ls.acceptance_rate,
    ls.current_rating,
    DENSE_RANK() OVER (
        ORDER BY ls.total_xp DESC, ls.problems_solved DESC, ls.acceptance_rate DESC
    ) AS rank
FROM public.users u
JOIN public.leaderboard_scores ls ON u.id = ls.user_id;

-- 3. Department Leaderboard View
CREATE OR REPLACE VIEW public.v_department_leaderboard AS
SELECT 
    u.id AS user_id,
    u.full_name,
    u.username,
    u.department_id,
    d.name AS department_name,
    ls.total_xp,
    ls.problems_solved,
    ls.acceptance_rate,
    DENSE_RANK() OVER (
        PARTITION BY u.department_id 
        ORDER BY ls.total_xp DESC, ls.problems_solved DESC, ls.acceptance_rate DESC
    ) AS department_rank
FROM public.users u
JOIN public.leaderboard_scores ls ON u.id = ls.user_id
LEFT JOIN public.departments d ON u.department_id = d.id;

-- 4. Class Leaderboard View
CREATE OR REPLACE VIEW public.v_class_leaderboard AS
SELECT 
    u.id AS user_id,
    u.full_name,
    u.username,
    u.class_id,
    c.name AS class_name,
    ls.total_xp,
    ls.problems_solved,
    ls.acceptance_rate,
    DENSE_RANK() OVER (
        PARTITION BY u.class_id 
        ORDER BY ls.total_xp DESC, ls.problems_solved DESC, ls.acceptance_rate DESC
    ) AS class_rank
FROM public.users u
JOIN public.leaderboard_scores ls ON u.id = ls.user_id
LEFT JOIN public.classes c ON u.class_id = c.id;

-- 5. Weekly Leaderboard View
CREATE OR REPLACE VIEW public.v_weekly_leaderboard AS
SELECT 
    u.id AS user_id,
    u.full_name,
    u.username,
    u.profile_image,
    COUNT(DISTINCT sp.problem_id) AS weekly_problems_solved,
    COUNT(s.id) AS weekly_submissions,
    COALESCE(SUM(CASE WHEN s.verdict = 'ACCEPTED' THEN 50 ELSE 0 END), 0) AS weekly_xp_gained,
    DENSE_RANK() OVER (
        ORDER BY COALESCE(SUM(CASE WHEN s.verdict = 'ACCEPTED' THEN 50 ELSE 0 END), 0) DESC, COUNT(DISTINCT sp.problem_id) DESC
    ) AS weekly_rank
FROM public.users u
LEFT JOIN public.submissions s ON u.id = s.user_id AND s.submitted_at >= NOW() - INTERVAL '7 days'
LEFT JOIN public.solved_problems sp ON u.id = sp.user_id AND sp.solved_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.full_name, u.username, u.profile_image;

-- 6. Monthly Leaderboard View
CREATE OR REPLACE VIEW public.v_monthly_leaderboard AS
SELECT 
    u.id AS user_id,
    u.full_name,
    u.username,
    u.profile_image,
    COUNT(DISTINCT sp.problem_id) AS monthly_problems_solved,
    COUNT(s.id) AS monthly_submissions,
    COALESCE(SUM(CASE WHEN s.verdict = 'ACCEPTED' THEN 50 ELSE 0 END), 0) AS monthly_xp_gained,
    DENSE_RANK() OVER (
        ORDER BY COALESCE(SUM(CASE WHEN s.verdict = 'ACCEPTED' THEN 50 ELSE 0 END), 0) DESC, COUNT(DISTINCT sp.problem_id) DESC
    ) AS monthly_rank
FROM public.users u
LEFT JOIN public.submissions s ON u.id = s.user_id AND s.submitted_at >= NOW() - INTERVAL '30 days'
LEFT JOIN public.solved_problems sp ON u.id = sp.user_id AND sp.solved_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.full_name, u.username, u.profile_image;

-- 7. Contest Leaderboard View
CREATE OR REPLACE VIEW public.v_contest_leaderboard AS
SELECT 
    u.id AS user_id,
    u.full_name,
    u.username,
    ur.current_rating,
    ur.highest_rating,
    ur.rating_tier,
    ls.contests_participated,
    ls.contests_won,
    DENSE_RANK() OVER (
        ORDER BY ur.current_rating DESC, ls.contests_won DESC, ls.contests_participated DESC
    ) AS contest_rank
FROM public.users u
JOIN public.user_ratings ur ON u.id = ur.user_id
JOIN public.leaderboard_scores ls ON u.id = ls.user_id;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.leaderboard_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on leaderboard_scores" ON public.leaderboard_scores FOR SELECT USING (true);
CREATE POLICY "Allow public read on user_ratings" ON public.user_ratings FOR SELECT USING (true);
CREATE POLICY "Allow public read on leaderboard_snapshots" ON public.leaderboard_snapshots FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage leaderboard_scores" ON public.leaderboard_scores FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('admin', 'super_admin'))
);
CREATE POLICY "Allow admins to manage user_ratings" ON public.user_ratings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('admin', 'super_admin'))
);
CREATE POLICY "Allow admins to manage leaderboard_snapshots" ON public.leaderboard_snapshots FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('admin', 'super_admin'))
);
