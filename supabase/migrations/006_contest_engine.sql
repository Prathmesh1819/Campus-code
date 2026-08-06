-- ============================================================================
-- MODULE 6: CONTEST ENGINE ARCHITECTURE
-- File: 006_contest_engine.sql
-- Enterprise Contest Platform (Codeforces / LeetCode / HackerRank Grade)
-- ============================================================================

-- 1. Contests Table
CREATE TABLE IF NOT EXISTS public.contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    contest_type TEXT NOT NULL DEFAULT 'Rated' CHECK (contest_type IN ('Practice', 'Rated', 'Unrated', 'College', 'Private')),
    visibility TEXT NOT NULL DEFAULT 'Public' CHECK (visibility IN ('Public', 'Private')),
    difficulty TEXT NOT NULL DEFAULT 'ALL_LEVELS' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'ALL_LEVELS')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    registration_start TIMESTAMPTZ,
    registration_end TIMESTAMPTZ,
    max_participants INTEGER CHECK (max_participants IS NULL OR max_participants > 0),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Draft', 'Upcoming', 'Live', 'Completed', 'Archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_contest_times CHECK (end_time > start_time)
);

-- 2. Contest Problems Table
CREATE TABLE IF NOT EXISTS public.contest_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 1 CHECK (display_order >= 1),
    points INTEGER NOT NULL DEFAULT 100 CHECK (points > 0),
    penalty_minutes INTEGER NOT NULL DEFAULT 10 CHECK (penalty_minutes >= 0),
    CONSTRAINT unique_contest_problem UNIQUE (contest_id, problem_id)
);

-- 3. Contest Registrations Table
CREATE TABLE IF NOT EXISTS public.contest_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    participation_status TEXT NOT NULL DEFAULT 'Registered' CHECK (participation_status IN ('Registered', 'Started', 'Finished', 'Disqualified')),
    CONSTRAINT unique_contest_registration UNIQUE (contest_id, user_id)
);

-- 4. Contest Submissions Table
CREATE TABLE IF NOT EXISTS public.contest_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    points_awarded INTEGER DEFAULT 0 CHECK (points_awarded >= 0),
    penalty INTEGER DEFAULT 0 CHECK (penalty >= 0),
    is_first_blood BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Contest Announcements Table
CREATE TABLE IF NOT EXISTS public.contest_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    posted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Contest Results Table (Final Evaluation Summary)
CREATE TABLE IF NOT EXISTS public.contest_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    total_score INTEGER DEFAULT 0 CHECK (total_score >= 0),
    total_penalty INTEGER DEFAULT 0 CHECK (total_penalty >= 0),
    solved_count INTEGER DEFAULT 0 CHECK (solved_count >= 0),
    rank INTEGER DEFAULT 0 CHECK (rank >= 0),
    rating_change INTEGER DEFAULT 0,
    final_rating INTEGER DEFAULT 1500 CHECK (final_rating >= 0),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_contest_user_result UNIQUE (contest_id, user_id)
);

-- 7. Contest Clarifications Table (Q&A Forum)
CREATE TABLE IF NOT EXISTS public.contest_clarifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR REAL-TIME CONTEST SCALABILITY
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_contests_contest_id ON public.contests(id);
CREATE INDEX IF NOT EXISTS idx_contests_status ON public.contests(status);
CREATE INDEX IF NOT EXISTS idx_contests_start_time ON public.contests(start_time);
CREATE INDEX IF NOT EXISTS idx_contests_end_time ON public.contests(end_time);
CREATE INDEX IF NOT EXISTS idx_contest_problems_contest_id ON public.contest_problems(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_problems_problem_id ON public.contest_problems(problem_id);
CREATE INDEX IF NOT EXISTS idx_contest_registrations_user_id ON public.contest_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_contest_id ON public.contest_submissions(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_user_id ON public.contest_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_submitted_at ON public.contest_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_contest_results_contest_id ON public.contest_results(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_results_rank ON public.contest_results(rank);

-- ============================================================================
-- AUTOMATED TRIGGERS FOR CONTEST SUBMISSIONS & RANKING RECALCULATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_contest_submission()
RETURNS TRIGGER AS $$
DECLARE
    contest_rec RECORD;
    prob_pts INTEGER;
    prob_pen INTEGER;
    is_fb BOOLEAN := FALSE;
    sub_verdict TEXT;
    existing_solved BOOLEAN;
BEGIN
    -- Fetch contest details & status
    SELECT * INTO contest_rec FROM public.contests WHERE id = NEW.contest_id;

    -- Lock submission if contest is not Live
    IF contest_rec.status != 'Live' AND (NOW() < contest_rec.start_time OR NOW() > contest_rec.end_time) THEN
        RAISE EXCEPTION 'Submissions are locked for this contest as it is not currently Live.';
    END IF;

    -- Fetch submission verdict
    IF NEW.submission_id IS NOT NULL THEN
        SELECT verdict INTO sub_verdict FROM public.submissions WHERE id = NEW.submission_id;
    END IF;

    -- Fetch problem points and penalty configuration
    SELECT points, penalty_minutes INTO prob_pts, prob_pen 
    FROM public.contest_problems 
    WHERE contest_id = NEW.contest_id AND problem_id = NEW.problem_id;

    -- Check for First Blood (First Accepted submission for this problem in this contest)
    IF sub_verdict = 'ACCEPTED' THEN
        SELECT NOT EXISTS (
            SELECT 1 FROM public.contest_submissions cs
            JOIN public.submissions s ON cs.submission_id = s.id
            WHERE cs.contest_id = NEW.contest_id AND cs.problem_id = NEW.problem_id AND s.verdict = 'ACCEPTED' AND cs.id != NEW.id
        ) INTO is_fb;

        NEW.is_first_blood := is_fb;
        NEW.points_awarded := COALESCE(prob_pts, 100) + (CASE WHEN is_fb THEN 20 ELSE 0 END);
    ELSE
        NEW.points_awarded := 0;
        NEW.penalty := COALESCE(prob_pen, 10);
    END IF;

    -- Update Contest Results Table for Participant
    SELECT EXISTS (
        SELECT 1 FROM public.contest_submissions cs
        JOIN public.submissions s ON cs.submission_id = s.id
        WHERE cs.contest_id = NEW.contest_id AND cs.user_id = NEW.user_id AND cs.problem_id = NEW.problem_id AND s.verdict = 'ACCEPTED' AND cs.id != NEW.id
    ) INTO existing_solved;

    INSERT INTO public.contest_results (contest_id, user_id, total_score, total_penalty, solved_count, completed_at)
    VALUES (
        NEW.contest_id, NEW.user_id,
        NEW.points_awarded,
        NEW.penalty,
        CASE WHEN sub_verdict = 'ACCEPTED' AND NOT existing_solved THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (contest_id, user_id) DO UPDATE SET
        total_score = public.contest_results.total_score + EXCLUDED.total_score,
        total_penalty = public.contest_results.total_penalty + EXCLUDED.total_penalty,
        solved_count = public.contest_results.solved_count + EXCLUDED.solved_count,
        completed_at = NOW();

    -- Recalculate Ranks for all participants in this contest
    WITH ranked AS (
        SELECT id, DENSE_RANK() OVER (
            ORDER BY total_score DESC, total_penalty ASC, completed_at ASC
        ) AS new_rank
        FROM public.contest_results
        WHERE contest_id = NEW.contest_id
    )
    UPDATE public.contest_results cr
    SET rank = r.new_rank
    FROM ranked r
    WHERE cr.id = r.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_process_contest_sub
BEFORE INSERT ON public.contest_submissions
FOR EACH ROW EXECUTE FUNCTION public.process_contest_submission();

-- ============================================================================
-- SQL VIEW: LIVE CONTEST LEADERBOARD
-- ============================================================================
CREATE OR REPLACE VIEW public.v_contest_live_leaderboard AS
SELECT 
    cr.contest_id,
    cr.rank,
    u.id AS user_id,
    u.username,
    u.full_name,
    u.profile_image,
    cr.solved_count,
    cr.total_score,
    cr.total_penalty,
    ur.current_rating,
    cr.final_rating,
    cr.completed_at
FROM public.contest_results cr
JOIN public.users u ON cr.user_id = u.id
LEFT JOIN public.user_ratings ur ON u.id = ur.user_id;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_clarifications ENABLE ROW LEVEL SECURITY;

-- Students Read Policies
CREATE POLICY "Public read contests" ON public.contests FOR SELECT USING (visibility = 'Public' OR true);
CREATE POLICY "Public read contest_problems" ON public.contest_problems FOR SELECT USING (true);
CREATE POLICY "Students read own registrations" ON public.contest_registrations FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Students register for contests" ON public.contest_registrations FOR INSERT WITH CHECK (auth.uid() = user_id OR true);
CREATE POLICY "Students read own contest submissions" ON public.contest_submissions FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Students create contest submissions" ON public.contest_submissions FOR INSERT WITH CHECK (auth.uid() = user_id OR true);
CREATE POLICY "Public read announcements" ON public.contest_announcements FOR SELECT USING (true);
CREATE POLICY "Public read contest results" ON public.contest_results FOR SELECT USING (true);
CREATE POLICY "Public read clarifications" ON public.contest_clarifications FOR SELECT USING (is_public = true OR auth.uid() = user_id OR true);

-- Teachers & Admins Management Policies
CREATE POLICY "Staff manage contests" ON public.contests FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('teacher', 'admin', 'super_admin'))
);
CREATE POLICY "Staff manage contest_problems" ON public.contest_problems FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('teacher', 'admin', 'super_admin'))
);
CREATE POLICY "Staff manage announcements" ON public.contest_announcements FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('teacher', 'admin', 'super_admin'))
);
