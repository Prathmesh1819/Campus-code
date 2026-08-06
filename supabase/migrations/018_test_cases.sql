-- 018_test_cases.sql
CREATE TABLE IF NOT EXISTS public.test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    weight INTEGER DEFAULT 1 CHECK (weight >= 0),
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_test_cases_problem_id ON public.test_cases(problem_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_is_hidden ON public.test_cases(is_hidden);

-- RLS
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to non-hidden test cases" ON public.test_cases FOR SELECT USING (
    is_hidden = false OR EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('admin', 'super_admin'))
);
CREATE POLICY "Allow admins to manage test cases" ON public.test_cases FOR ALL USING (true);
