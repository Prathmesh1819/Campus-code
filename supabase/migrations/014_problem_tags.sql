-- 014_problem_tags.sql
CREATE TABLE IF NOT EXISTS public.problem_tags (
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (problem_id, tag_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_problem_tags_problem_id ON public.problem_tags(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_tags_tag_id ON public.problem_tags(tag_id);

-- RLS
ALTER TABLE public.problem_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on problem_tags" ON public.problem_tags FOR SELECT USING (true);
CREATE POLICY "Allow admins to manage problem_tags" ON public.problem_tags FOR ALL USING (true);
