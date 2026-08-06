-- 003_problem_metadata.sql
CREATE TABLE IF NOT EXISTS public.problem_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL UNIQUE REFERENCES public.problems(id) ON DELETE CASCADE,
    function_name TEXT NOT NULL,
    return_type TEXT NOT NULL,
    parameter_metadata JSONB NOT NULL DEFAULT '[]'::jsonb,
    supported_languages JSONB NOT NULL DEFAULT '["java", "javascript", "python", "cpp", "c", "go", "rust", "kotlin"]'::jsonb,
    wrapper_configuration JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_problem_metadata_problem_id ON public.problem_metadata(problem_id);

-- RLS
ALTER TABLE public.problem_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to problem metadata"
    ON public.problem_metadata FOR SELECT
    USING (true);

CREATE POLICY "Allow admins to insert problem metadata"
    ON public.problem_metadata FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));

CREATE POLICY "Allow admins to update problem metadata"
    ON public.problem_metadata FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));

CREATE POLICY "Allow admins to delete problem metadata"
    ON public.problem_metadata FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));
