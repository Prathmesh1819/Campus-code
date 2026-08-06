-- 019_editorials.sql
CREATE TABLE IF NOT EXISTS public.editorials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL UNIQUE REFERENCES public.problems(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    video_url TEXT,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_editorials_problem_id ON public.editorials(problem_id);

-- RLS
ALTER TABLE public.editorials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to editorials" ON public.editorials FOR SELECT USING (true);
CREATE POLICY "Allow admins to manage editorials" ON public.editorials FOR ALL USING (true);
