-- 004_streams.sql
CREATE TABLE IF NOT EXISTS public.streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_streams_code ON public.streams(code);
CREATE INDEX IF NOT EXISTS idx_streams_department_id ON public.streams(department_id);

-- RLS
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to streams" ON public.streams FOR SELECT USING (true);
CREATE POLICY "Allow admins to manage streams" ON public.streams FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role_id IN (SELECT id FROM public.roles WHERE name IN ('admin', 'super_admin')))
);
