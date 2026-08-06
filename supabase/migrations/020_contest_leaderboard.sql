-- 020_contest_leaderboard.sql
CREATE TABLE IF NOT EXISTS public.contest_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    total_score INTEGER DEFAULT 0 CHECK (total_score >= 0),
    finish_time TIMESTAMPTZ,
    rank INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_contest_user_leaderboard UNIQUE (contest_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contest_leaderboard_contest_id ON public.contest_leaderboard(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_leaderboard_user_id ON public.contest_leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_leaderboard_rank ON public.contest_leaderboard(rank);

-- RLS
ALTER TABLE public.contest_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to contest leaderboard"
    ON public.contest_leaderboard FOR SELECT
    USING (true);

CREATE POLICY "Allow contest leaderboard updates"
    ON public.contest_leaderboard FOR ALL
    USING (true);
