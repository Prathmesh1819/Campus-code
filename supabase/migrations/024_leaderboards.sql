-- 024_leaderboards.sql

-- Global Leaderboard
CREATE TABLE IF NOT EXISTS public.global_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    solved_count INTEGER DEFAULT 0 CHECK (solved_count >= 0),
    score INTEGER DEFAULT 0 CHECK (score >= 0),
    rank INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- College / Department / Class Leaderboard
CREATE TABLE IF NOT EXISTS public.college_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0 CHECK (score >= 0),
    rank INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weekly Leaderboard
CREATE TABLE IF NOT EXISTS public.weekly_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    score INTEGER DEFAULT 0 CHECK (score >= 0),
    rank INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_week UNIQUE (user_id, week_number, year)
);

-- Monthly Leaderboard
CREATE TABLE IF NOT EXISTS public.monthly_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    score INTEGER DEFAULT 0 CHECK (score >= 0),
    rank INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_month UNIQUE (user_id, month_number, year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_global_lb_score ON public.global_leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_global_lb_rank ON public.global_leaderboard(rank);
CREATE INDEX IF NOT EXISTS idx_college_lb_dept ON public.college_leaderboard(department_id);
CREATE INDEX IF NOT EXISTS idx_college_lb_class ON public.college_leaderboard(class_id);

-- RLS
ALTER TABLE public.global_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read global_leaderboard" ON public.global_leaderboard FOR SELECT USING (true);
CREATE POLICY "Allow public read college_leaderboard" ON public.college_leaderboard FOR SELECT USING (true);
CREATE POLICY "Allow public read weekly_leaderboard" ON public.weekly_leaderboard FOR SELECT USING (true);
CREATE POLICY "Allow public read monthly_leaderboard" ON public.monthly_leaderboard FOR SELECT USING (true);

CREATE POLICY "Allow manage global_leaderboard" ON public.global_leaderboard FOR ALL USING (true);
CREATE POLICY "Allow manage college_leaderboard" ON public.college_leaderboard FOR ALL USING (true);
CREATE POLICY "Allow manage weekly_leaderboard" ON public.weekly_leaderboard FOR ALL USING (true);
CREATE POLICY "Allow manage monthly_leaderboard" ON public.monthly_leaderboard FOR ALL USING (true);
