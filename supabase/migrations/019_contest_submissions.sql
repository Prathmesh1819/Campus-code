-- 019_contest_submissions.sql
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contest_submissions_contest_id ON public.contest_submissions(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_user_id ON public.contest_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_problem_id ON public.contest_submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_submitted_at ON public.contest_submissions(submitted_at);

-- RLS
ALTER TABLE public.contest_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own contest submissions"
    ON public.contest_submissions FOR SELECT
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'super_admin')
    ));

CREATE POLICY "Allow users to create contest submissions"
    ON public.contest_submissions FOR INSERT
    WITH CHECK (auth.uid() = user_id OR true);
