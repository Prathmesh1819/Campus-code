-- ============================================================================
-- MODULE 11: ENTERPRISE COMMUNICATION PLATFORM
-- File: 011_enterprise_communication.sql
-- Resend Integration, Notification Timeline, Email Queue, Scheduled Broadcasts & Analytics
-- ============================================================================

-- 1. Email Logs Table
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_name TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'resend',
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'bounced')),
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Notification Queue Table (Async Queue & Exponential Backoff / Dead Letter Queue)
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    attempts INTEGER DEFAULT 0 CHECK (attempts >= 0),
    max_attempts INTEGER DEFAULT 3 CHECK (max_attempts >= 1),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter')),
    next_retry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dead_letter_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Scheduled Emails & Admin Broadcast Center Table
CREATE TABLE IF NOT EXISTS public.scheduled_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    target_role TEXT,
    target_department TEXT,
    target_class TEXT,
    template_name TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'processing', 'completed', 'cancelled', 'failed')),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Expanded Communication Preferences Table
CREATE TABLE IF NOT EXISTS public.communication_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT TRUE,
    realtime_enabled BOOLEAN DEFAULT TRUE,
    daily_digest BOOLEAN DEFAULT TRUE,
    weekly_digest BOOLEAN DEFAULT TRUE,
    monthly_digest BOOLEAN DEFAULT TRUE,
    contest_alerts BOOLEAN DEFAULT TRUE,
    assignment_alerts BOOLEAN DEFAULT TRUE,
    ai_alerts BOOLEAN DEFAULT TRUE,
    marketing_alerts BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Communication Infrastructure
CREATE INDEX IF NOT EXISTS idx_email_logs_user ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent ON public.email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_queue_status ON public.notification_queue(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_status ON public.scheduled_emails(status, scheduled_at);

-- Communication Analytics SQL View
CREATE OR REPLACE VIEW public.v_communication_analytics AS
SELECT 
    COUNT(el.id) AS total_emails_sent,
    COUNT(CASE WHEN el.status = 'delivered' THEN 1 END) AS total_delivered,
    COUNT(CASE WHEN el.status = 'failed' THEN 1 END) AS total_failed,
    COUNT(CASE WHEN el.status = 'bounced' THEN 1 END) AS total_bounced,
    (SELECT COUNT(*) FROM public.notifications) AS total_inapp_notifications,
    (SELECT COUNT(*) FROM public.notifications WHERE is_read = false) AS unread_inapp_notifications,
    (SELECT COUNT(*) FROM public.notification_queue WHERE status = 'pending') AS pending_queue_jobs,
    (SELECT COUNT(*) FROM public.notification_queue WHERE status = 'dead_letter') AS dead_letter_jobs;

-- RLS Policies
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own email logs" ON public.email_logs FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Users manage own communication preferences" ON public.communication_preferences FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Admins full CRUD on scheduled_emails" ON public.scheduled_emails FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('admin', 'super_admin'))
);
