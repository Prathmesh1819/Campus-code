-- 017_contests.sql
CREATE TABLE IF NOT EXISTS public.contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended')),
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_contest_dates CHECK (end_time > start_time)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contests_slug ON public.contests(slug);
CREATE INDEX IF NOT EXISTS idx_contests_status ON public.contests(status);
CREATE INDEX IF NOT EXISTS idx_contests_start_time ON public.contests(start_time);

-- RLS
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to contests"
    ON public.contests FOR SELECT
    USING (true);

CREATE POLICY "Allow teachers and admins to manage contests"
    ON public.contests FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'super_admin')
    ));
