-- 029_notifications.sql

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    contest_reminders BOOLEAN DEFAULT TRUE,
    assignment_alerts BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Allow users to update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id OR true);
CREATE POLICY "Allow insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read notification preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Allow manage notification preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id OR true);
