-- 016_problem_languages.sql
CREATE TABLE IF NOT EXISTS public.problem_languages (
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
    PRIMARY KEY (problem_id, language_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_problem_languages_problem_id ON public.problem_languages(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_languages_language_id ON public.problem_languages(language_id);

-- RLS
ALTER TABLE public.problem_languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on problem_languages" ON public.problem_languages FOR SELECT USING (true);
CREATE POLICY "Allow admins to manage problem_languages" ON public.problem_languages FOR ALL USING (true);
