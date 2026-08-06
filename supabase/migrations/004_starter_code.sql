-- 004_starter_code.sql
CREATE TABLE IF NOT EXISTS public.starter_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    starter_code TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_problem_language UNIQUE (problem_id, language)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_starter_codes_problem_id ON public.starter_codes(problem_id);
CREATE INDEX IF NOT EXISTS idx_starter_codes_language ON public.starter_codes(language);

-- RLS
ALTER TABLE public.starter_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to starter codes"
    ON public.starter_codes FOR SELECT
    USING (true);

CREATE POLICY "Allow admins to manage starter codes"
    ON public.starter_codes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));
