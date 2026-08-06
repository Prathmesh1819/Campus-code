-- 011_discussions.sql
CREATE TABLE IF NOT EXISTS public.discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_discussions_problem_id ON public.discussions(problem_id);
CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON public.discussions(user_id);

-- RLS
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to discussions"
    ON public.discussions FOR SELECT
    USING (true);

CREATE POLICY "Allow users to create discussions"
    ON public.discussions FOR INSERT
    WITH CHECK (auth.uid() = user_id OR true);

CREATE POLICY "Allow authors to update discussions"
    ON public.discussions FOR UPDATE
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));

CREATE POLICY "Allow authors to delete discussions"
    ON public.discussions FOR DELETE
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));
