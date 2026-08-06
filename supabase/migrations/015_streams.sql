-- 015_streams.sql
CREATE TABLE IF NOT EXISTS public.streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_streams_code ON public.streams(code);

-- RLS
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to streams"
    ON public.streams FOR SELECT
    USING (true);

CREATE POLICY "Allow admins to manage streams"
    ON public.streams FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));
