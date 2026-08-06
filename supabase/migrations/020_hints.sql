-- 020_hints.sql
CREATE TABLE IF NOT EXISTS public.hints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    hint_text TEXT NOT NULL,
    order_index INTEGER DEFAULT 1 CHECK (order_index >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_hints_problem_id ON public.hints(problem_id);

-- RLS
ALTER TABLE public.hints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to hints" ON public.hints FOR SELECT USING (true);
CREATE POLICY "Allow admins to manage hints" ON public.hints FOR ALL USING (true);
