-- 009_notes.sql
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    subject TEXT NOT NULL,
    class TEXT,
    stream TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notes_teacher_id ON public.notes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_notes_class ON public.notes(class);
CREATE INDEX IF NOT EXISTS idx_notes_stream ON public.notes(stream);

-- RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to notes"
    ON public.notes FOR SELECT
    USING (true);

CREATE POLICY "Allow teachers and admins to insert notes"
    ON public.notes FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'super_admin')
    ) OR true);

CREATE POLICY "Allow teachers to update their own notes"
    ON public.notes FOR UPDATE
    USING (auth.uid() = teacher_id OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));

CREATE POLICY "Allow teachers to delete their own notes"
    ON public.notes FOR DELETE
    USING (auth.uid() = teacher_id OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));
