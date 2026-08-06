-- 005_semesters.sql
CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INTEGER NOT NULL CHECK (number >= 1 AND number <= 8),
    academic_year TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_semesters_number ON public.semesters(number);

-- RLS
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to semesters" ON public.semesters FOR SELECT USING (true);
CREATE POLICY "Allow admins to manage semesters" ON public.semesters FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role_id IN (SELECT id FROM public.roles WHERE name IN ('admin', 'super_admin')))
);
