-- 023_coding_user_features.sql

-- Solved Problems
CREATE TABLE IF NOT EXISTS public.solved_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    solved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_solved UNIQUE (user_id, problem_id)
);

-- Bookmarked Problems
CREATE TABLE IF NOT EXISTS public.bookmarked_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_bookmark UNIQUE (user_id, problem_id)
);

-- Favorite Problems
CREATE TABLE IF NOT EXISTS public.favorite_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_favorite UNIQUE (user_id, problem_id)
);

-- Problem Attempts
CREATE TABLE IF NOT EXISTS public.problem_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    attempts_count INTEGER DEFAULT 1 CHECK (attempts_count >= 1),
    last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_attempt UNIQUE (user_id, problem_id)
);

-- Daily Streaks
CREATE TABLE IF NOT EXISTS public.daily_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
    max_streak INTEGER DEFAULT 0 CHECK (max_streak >= 0),
    last_active_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Statistics
CREATE TABLE IF NOT EXISTS public.user_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    easy_solved INTEGER DEFAULT 0 CHECK (easy_solved >= 0),
    medium_solved INTEGER DEFAULT 0 CHECK (medium_solved >= 0),
    hard_solved INTEGER DEFAULT 0 CHECK (hard_solved >= 0),
    total_submissions INTEGER DEFAULT 0 CHECK (total_submissions >= 0),
    accepted_submissions INTEGER DEFAULT 0 CHECK (accepted_submissions >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Language Statistics
CREATE TABLE IF NOT EXISTS public.language_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
    submissions_count INTEGER DEFAULT 0 CHECK (submissions_count >= 0),
    accepted_count INTEGER DEFAULT 0 CHECK (accepted_count >= 0),
    CONSTRAINT unique_user_language UNIQUE (user_id, language_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_solved_user_id ON public.solved_problems(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarked_problems(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorite_problems(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON public.problem_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON public.daily_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_statistics(user_id);

-- RLS
ALTER TABLE public.solved_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarked_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.language_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read on user coding features" ON public.solved_problems FOR SELECT USING (true);
CREATE POLICY "Allow manage solved" ON public.solved_problems FOR ALL USING (true);

CREATE POLICY "Allow read bookmarks" ON public.bookmarked_problems FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Allow manage bookmarks" ON public.bookmarked_problems FOR ALL USING (true);

CREATE POLICY "Allow read favorites" ON public.favorite_problems FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Allow manage favorites" ON public.favorite_problems FOR ALL USING (true);

CREATE POLICY "Allow read attempts" ON public.problem_attempts FOR SELECT USING (true);
CREATE POLICY "Allow manage attempts" ON public.problem_attempts FOR ALL USING (true);

CREATE POLICY "Allow read streaks" ON public.daily_streaks FOR SELECT USING (true);
CREATE POLICY "Allow manage streaks" ON public.daily_streaks FOR ALL USING (true);

CREATE POLICY "Allow read user_statistics" ON public.user_statistics FOR SELECT USING (true);
CREATE POLICY "Allow manage user_statistics" ON public.user_statistics FOR ALL USING (true);

CREATE POLICY "Allow read language_statistics" ON public.language_statistics FOR SELECT USING (true);
CREATE POLICY "Allow manage language_statistics" ON public.language_statistics FOR ALL USING (true);
