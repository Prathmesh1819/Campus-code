-- 013_problem_metadata.sql
CREATE TABLE IF NOT EXISTS public.problem_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL UNIQUE REFERENCES public.problems(id) ON DELETE CASCADE,
    function_name TEXT NOT NULL,
    return_type TEXT NOT NULL,
    parameters JSONB NOT NULL DEFAULT '[]'::jsonb,
    wrapper_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_problem_metadata_problem_id ON public.problem_metadata(problem_id);

-- RLS
ALTER TABLE public.problem_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to problem_metadata" ON public.problem_metadata FOR SELECT USING (true);
CREATE POLICY "Allow admins to manage problem_metadata" ON public.problem_metadata FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('admin', 'super_admin'))
);
