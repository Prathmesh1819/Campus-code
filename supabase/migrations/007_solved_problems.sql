-- 007_solved_problems.sql
CREATE TABLE IF NOT EXISTS public.solved_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    solved_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_solved_problem UNIQUE (user_id, problem_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_solved_problems_user_id ON public.solved_problems(user_id);
CREATE INDEX IF NOT EXISTS idx_solved_problems_problem_id ON public.solved_problems(problem_id);

-- RLS
ALTER TABLE public.solved_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for solved problems"
    ON public.solved_problems FOR SELECT
    USING (true);

CREATE POLICY "Allow users to record solved problems"
    ON public.solved_problems FOR INSERT
    WITH CHECK (auth.uid() = user_id OR true);
