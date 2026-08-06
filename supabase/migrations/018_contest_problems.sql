-- 018_contest_problems.sql
CREATE TABLE IF NOT EXISTS public.contest_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 100 CHECK (points > 0),
    order_index INTEGER DEFAULT 1,
    CONSTRAINT unique_contest_problem UNIQUE (contest_id, problem_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contest_problems_contest_id ON public.contest_problems(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_problems_problem_id ON public.contest_problems(problem_id);

-- RLS
ALTER TABLE public.contest_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to contest problems"
    ON public.contest_problems FOR SELECT
    USING (true);

CREATE POLICY "Allow teachers and admins to manage contest problems"
    ON public.contest_problems FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'super_admin')
    ));
