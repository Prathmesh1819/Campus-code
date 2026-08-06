-- 017_starter_codes.sql
CREATE TABLE IF NOT EXISTS public.starter_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
    starter_code TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_problem_language_code UNIQUE (problem_id, language_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_starter_codes_problem_id ON public.starter_codes(problem_id);
CREATE INDEX IF NOT EXISTS idx_starter_codes_language_id ON public.starter_codes(language_id);

-- RLS
ALTER TABLE public.starter_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to starter codes" ON public.starter_codes FOR SELECT USING (true);
CREATE POLICY "Allow admins to manage starter codes" ON public.starter_codes FOR ALL USING (true);
