-- 022_submission_results.sql
CREATE TABLE IF NOT EXISTS public.submission_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL UNIQUE REFERENCES public.submissions(id) ON DELETE CASCADE,
    stdout TEXT,
    stderr TEXT,
    compile_output TEXT,
    message TEXT,
    status JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_submission_results_submission_id ON public.submission_results(submission_id);

-- RLS
ALTER TABLE public.submission_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read on submission_results" ON public.submission_results FOR SELECT USING (true);
CREATE POLICY "Allow insert on submission_results" ON public.submission_results FOR INSERT WITH CHECK (true);
