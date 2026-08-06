-- 010_projects.sql
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    github_url TEXT,
    live_url TEXT,
    tech_stack JSONB DEFAULT '[]'::jsonb,
    likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_student_id ON public.projects(student_id);

-- RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to projects"
    ON public.projects FOR SELECT
    USING (true);

CREATE POLICY "Allow students to insert projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = student_id OR true);

CREATE POLICY "Allow students to update their own projects"
    ON public.projects FOR UPDATE
    USING (auth.uid() = student_id OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));

CREATE POLICY "Allow students to delete their own projects"
    ON public.projects FOR DELETE
    USING (auth.uid() = student_id OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));
