-- 014_classes.sql
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_classes_code ON public.classes(code);

-- RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to classes"
    ON public.classes FOR SELECT
    USING (true);

CREATE POLICY "Allow teachers and admins to manage classes"
    ON public.classes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'super_admin')
    ));
