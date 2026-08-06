-- 006_classes.sql
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID REFERENCES public.streams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    year TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_classes_code ON public.classes(code);
CREATE INDEX IF NOT EXISTS idx_classes_stream_id ON public.classes(stream_id);

-- RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Allow admins to manage classes" ON public.classes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role_id IN (SELECT id FROM public.roles WHERE name IN ('admin', 'super_admin')))
);
