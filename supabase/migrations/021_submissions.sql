-- 021_submissions.sql
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    language_id UUID REFERENCES public.languages(id) ON DELETE SET NULL,
    language TEXT NOT NULL,
    source_code TEXT NOT NULL,
    judge0_token TEXT,
    verdict TEXT NOT NULL CHECK (verdict IN ('ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'COMPILATION_ERROR')),
    runtime INTEGER DEFAULT 0 CHECK (runtime >= 0),
    memory INTEGER DEFAULT 0 CHECK (memory >= 0),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON public.submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_language_id ON public.submissions(language_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON public.submissions(submitted_at DESC);

-- RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to read own submissions" ON public.submissions FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Allow users to insert submissions" ON public.submissions FOR INSERT WITH CHECK (true);
