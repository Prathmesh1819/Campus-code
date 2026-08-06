-- 008_leaderboard.sql
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    solved_count INTEGER DEFAULT 0 CHECK (solved_count >= 0),
    score INTEGER DEFAULT 0 CHECK (score >= 0),
    rank INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON public.leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON public.leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON public.leaderboard(rank);

-- RLS
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to leaderboard"
    ON public.leaderboard FOR SELECT
    USING (true);

CREATE POLICY "Allow leaderboard updates"
    ON public.leaderboard FOR ALL
    USING (true);
