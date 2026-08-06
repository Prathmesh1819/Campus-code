-- 025_contests.sql

-- Contests
CREATE TABLE IF NOT EXISTS public.contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended')),
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_contest_time CHECK (end_time > start_time)
);

-- Contest Problems
CREATE TABLE IF NOT EXISTS public.contest_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 100 CHECK (points > 0),
    order_index INTEGER DEFAULT 1,
    CONSTRAINT unique_contest_problem UNIQUE (contest_id, problem_id)
);

-- Contest Registrations
CREATE TABLE IF NOT EXISTS public.contest_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_contest_registration UNIQUE (contest_id, user_id)
);

-- Contest Submissions
CREATE TABLE IF NOT EXISTS public.contest_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    source_code TEXT NOT NULL,
    verdict TEXT NOT NULL CHECK (verdict IN ('ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'COMPILATION_ERROR')),
    score INTEGER DEFAULT 0 CHECK (score >= 0),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contest Leaderboard
CREATE TABLE IF NOT EXISTS public.contest_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    total_score INTEGER DEFAULT 0 CHECK (total_score >= 0),
    finish_time TIMESTAMPTZ,
    rank INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_contest_user_lb UNIQUE (contest_id, user_id)
);

-- Contest Announcements
CREATE TABLE IF NOT EXISTS public.contest_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contests_slug ON public.contests(slug);
CREATE INDEX IF NOT EXISTS idx_contests_status ON public.contests(status);
CREATE INDEX IF NOT EXISTS idx_contests_start_time ON public.contests(start_time);
CREATE INDEX IF NOT EXISTS idx_contest_problems_contest_id ON public.contest_problems(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_registrations_contest_id ON public.contest_registrations(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_contest_id ON public.contest_submissions(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_lb_contest_id ON public.contest_leaderboard(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_lb_rank ON public.contest_leaderboard(rank);

-- RLS
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read contests" ON public.contests FOR SELECT USING (true);
CREATE POLICY "Allow manage contests" ON public.contests FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('teacher', 'admin', 'super_admin'))
);

CREATE POLICY "Allow read contest_problems" ON public.contest_problems FOR SELECT USING (true);
CREATE POLICY "Allow manage contest_problems" ON public.contest_problems FOR ALL USING (true);

CREATE POLICY "Allow read contest_registrations" ON public.contest_registrations FOR SELECT USING (true);
CREATE POLICY "Allow insert contest_registrations" ON public.contest_registrations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read contest_submissions" ON public.contest_submissions FOR SELECT USING (true);
CREATE POLICY "Allow insert contest_submissions" ON public.contest_submissions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read contest_leaderboard" ON public.contest_leaderboard FOR SELECT USING (true);
CREATE POLICY "Allow manage contest_leaderboard" ON public.contest_leaderboard FOR ALL USING (true);

CREATE POLICY "Allow read contest_announcements" ON public.contest_announcements FOR SELECT USING (true);
CREATE POLICY "Allow manage contest_announcements" ON public.contest_announcements FOR ALL USING (true);
