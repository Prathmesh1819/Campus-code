-- 002_problems.sql
CREATE TABLE IF NOT EXISTS public.problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    description TEXT NOT NULL,
    constraints TEXT NOT NULL,
    companies JSONB DEFAULT '[]'::jsonb,
    acceptance_rate NUMERIC(5, 2) DEFAULT 0.00 CHECK (acceptance_rate >= 0 AND acceptance_rate <= 100),
    tags JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_problems_slug ON public.problems(slug);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON public.problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_status ON public.problems(status);

-- RLS
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for published problems"
    ON public.problems FOR SELECT
    USING (status = 'published' OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));

CREATE POLICY "Allow admins to insert problems"
    ON public.problems FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));

CREATE POLICY "Allow admins to update problems"
    ON public.problems FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));

CREATE POLICY "Allow admins to delete problems"
    ON public.problems FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));
