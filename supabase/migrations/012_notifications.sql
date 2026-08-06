-- 012_notifications.sql
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id OR true);

CREATE POLICY "Allow users to update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id OR true);

CREATE POLICY "Allow notification creation"
    ON public.notifications FOR INSERT
    WITH CHECK (true);
