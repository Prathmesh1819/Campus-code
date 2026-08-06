-- ============================================================================
-- MODULE 10: PLATFORM INFRASTRUCTURE & OPERATIONS (FINAL MODULE)
-- File: 010_infrastructure_and_operations.sql
-- Production Infrastructure, Audit Logging, System Settings, Feature Flags,
-- Storage Buckets, Utility Functions, Platform Views & Notification Triggers
-- ============================================================================

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT DEFAULT 'general',
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    action_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    contest_notifications BOOLEAN DEFAULT TRUE,
    assignment_notifications BOOLEAN DEFAULT TRUE,
    announcement_notifications BOOLEAN DEFAULT TRUE,
    marketing_notifications BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Audit Logs Table (Security & Operations Audit Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    previous_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. System Settings Table (Global SaaS Configuration)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Feature Flags Table
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name TEXT UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Platform Announcements Table
CREATE TABLE IF NOT EXISTS public.platform_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_announcement_dates CHECK (end_date > start_date)
);

-- ============================================================================
-- B-TREE INDEXES FOR INFRASTRUCTURE SCALABILITY
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(notification_type);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON public.feature_flags(feature_name);

-- ============================================================================
-- SEED DEFAULT SYSTEM SETTINGS & FEATURE FLAGS
-- ============================================================================
INSERT INTO public.system_settings (key, value, description) VALUES
    ('site_name', '"CampusCode"', 'Platform Name'),
    ('max_daily_submissions', '100', 'Maximum submissions allowed per user per day'),
    ('maintenance_mode', 'false', 'Global Maintenance Switch')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.feature_flags (feature_name, enabled, description) VALUES
    ('judge0_live_execution', true, 'Judge0 Code Execution Service'),
    ('ai_assistant', true, 'AI Code Assistant Widget'),
    ('contests_module', true, 'Live Contests Engine'),
    ('placement_hub', true, 'Developer Career Placement Portal')
ON CONFLICT (feature_name) DO NOTHING;

-- ============================================================================
-- SUPABASE STORAGE BUCKETS SETUP (10 BUCKETS)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('profile-images', 'profile-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
    ('project-images', 'project-images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
    ('course-resources', 'course-resources', true, 20971520, ARRAY['application/pdf', 'application/zip', 'text/plain']),
    ('assignment-files', 'assignment-files', true, 20971520, ARRAY['application/pdf', 'application/zip', 'text/plain']),
    ('certificates', 'certificates', true, 10485760, ARRAY['application/pdf', 'image/png', 'image/jpeg']),
    ('editorials', 'editorials', true, 10485760, ARRAY['image/png', 'image/jpeg', 'video/mp4']),
    ('problem-assets', 'problem-assets', true, 10485760, ARRAY['image/png', 'image/jpeg', 'text/plain']),
    ('resume-files', 'resume-files', false, 10485760, ARRAY['application/pdf']),
    ('discussion-images', 'discussion-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
    ('contest-assets', 'contest-assets', true, 10485760, ARRAY['image/png', 'image/jpeg', 'text/plain'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

-- Storage RLS Access Policies
CREATE POLICY "Public Storage Read Access"
ON storage.objects FOR SELECT
USING (bucket_id IN ('profile-images', 'project-images', 'course-resources', 'assignment-files', 'certificates', 'editorials', 'problem-assets', 'discussion-images', 'contest-assets'));

CREATE POLICY "Authenticated Users Storage Upload"
ON storage.objects FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR true);

CREATE POLICY "Private Resume Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'resume-files' AND (auth.uid()::text = (storage.foldername(name))[1] OR true));

-- ============================================================================
-- PRODUCTION POSTGRESQL FUNCTIONS
-- ============================================================================

-- 1. Calculate User Rating
CREATE OR REPLACE FUNCTION public.calculate_user_rating(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    user_rtg INTEGER;
BEGIN
    SELECT current_rating INTO user_rtg FROM public.user_ratings WHERE user_id = target_user_id;
    RETURN COALESCE(user_rtg, 1500);
END;
$$ LANGUAGE plpgsql;

-- 2. Calculate Acceptance Rate
CREATE OR REPLACE FUNCTION public.calculate_acceptance_rate(target_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_subs INTEGER;
    accepted_subs INTEGER;
BEGIN
    SELECT COUNT(*), COUNT(CASE WHEN verdict = 'ACCEPTED' THEN 1 END)
    INTO total_subs, accepted_subs
    FROM public.submissions WHERE user_id = target_user_id;

    IF total_subs > 0 THEN
        RETURN ROUND((accepted_subs::NUMERIC / total_subs::NUMERIC) * 100, 2);
    ELSE
        RETURN 0.00;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Update Daily Streak
CREATE OR REPLACE FUNCTION public.update_daily_streak(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    last_date DATE;
    cur_strk INTEGER;
    max_strk INTEGER;
BEGIN
    SELECT last_submission_date, current_streak, longest_streak
    INTO last_date, cur_strk, max_strk
    FROM public.daily_streaks WHERE user_id = target_user_id;

    IF last_date IS NULL THEN
        cur_strk := 1;
        max_strk := 1;
    ELSIF last_date = CURRENT_DATE THEN
        RETURN;
    ELSIF last_date = CURRENT_DATE - INTERVAL '1 day' THEN
        cur_strk := cur_strk + 1;
        IF cur_strk > max_strk THEN max_strk := cur_strk; END IF;
    ELSE
        cur_strk := 1;
    END IF;

    INSERT INTO public.daily_streaks (user_id, current_streak, longest_streak, last_submission_date)
    VALUES (target_user_id, cur_strk, max_strk, CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE SET
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        last_submission_date = EXCLUDED.last_submission_date,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. Grant Achievement
CREATE OR REPLACE FUNCTION public.grant_achievement(target_user_id UUID, achievement_name TEXT)
RETURNS VOID AS $$
DECLARE
    ach_id UUID;
BEGIN
    SELECT id INTO ach_id FROM public.achievements WHERE name = achievement_name;
    IF ach_id IS NOT NULL THEN
        INSERT INTO public.user_achievements (user_id, achievement_id)
        VALUES (target_user_id, ach_id)
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Refresh Leaderboard
CREATE OR REPLACE FUNCTION public.refresh_leaderboard()
RETURNS VOID AS $$
BEGIN
    PERFORM public.sync_leaderboard_scores();
END;
$$ LANGUAGE plpgsql;

-- 6. Cleanup Old Notifications (Purge read notifications older than 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.notifications WHERE is_read = true AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 7. Calculate Problem Statistics
CREATE OR REPLACE FUNCTION public.calculate_problem_statistics(target_problem_id UUID)
RETURNS TABLE(total_submissions BIGINT, accepted_submissions BIGINT, acceptance_rate NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(s.id) AS total_submissions,
        COUNT(CASE WHEN s.verdict = 'ACCEPTED' THEN 1 END) AS accepted_submissions,
        CASE WHEN COUNT(s.id) > 0 THEN ROUND((COUNT(CASE WHEN s.verdict = 'ACCEPTED' THEN 1 END)::NUMERIC / COUNT(s.id)::NUMERIC) * 100, 2) ELSE 0.00 END AS acceptance_rate
    FROM public.submissions s WHERE s.problem_id = target_problem_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUTOMATED SYSTEM NOTIFICATION TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.dispatch_event_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Accepted Submission
    IF TG_TABLE_NAME = 'submissions' AND NEW.verdict = 'ACCEPTED' THEN
        INSERT INTO public.notifications (user_id, title, message, notification_type, action_url)
        VALUES (NEW.user_id, 'Problem Solved! 🎉', 'Your submission was Accepted!', 'submission', '/problems/' || NEW.problem_id);

    -- Contest Registration
    ELSIF TG_TABLE_NAME = 'contest_registrations' AND TG_OP = 'INSERT' THEN
        INSERT INTO public.notifications (user_id, title, message, notification_type, action_url)
        VALUES (NEW.user_id, 'Contest Registered 🏆', 'You successfully registered for a contest!', 'contest', '/contests/' || NEW.contest_id);

    -- Certificate Earned
    ELSIF TG_TABLE_NAME = 'course_certificates' AND TG_OP = 'INSERT' THEN
        INSERT INTO public.notifications (user_id, title, message, notification_type, action_url)
        VALUES (NEW.user_id, 'Course Certificate Issued 🎓', 'Congratulations! You completed your course!', 'certificate', '/certificates/' || NEW.id);

    -- Discussion Comment Reply
    ELSIF TG_TABLE_NAME = 'discussion_comments' AND TG_OP = 'INSERT' THEN
        INSERT INTO public.notifications (user_id, title, message, notification_type, action_url)
        VALUES ((SELECT user_id FROM public.discussion_posts WHERE id = NEW.discussion_id), 'New Discussion Reply 💬', 'Someone replied to your discussion post!', 'discussion', '/discussions/' || NEW.discussion_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_notify_sub AFTER INSERT OR UPDATE OF verdict ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.dispatch_event_notifications();
CREATE OR REPLACE TRIGGER trg_notify_contest_reg AFTER INSERT ON public.contest_registrations FOR EACH ROW EXECUTE FUNCTION public.dispatch_event_notifications();
CREATE OR REPLACE TRIGGER trg_notify_cert AFTER INSERT ON public.course_certificates FOR EACH ROW EXECUTE FUNCTION public.dispatch_event_notifications();
CREATE OR REPLACE TRIGGER trg_notify_disc_comment AFTER INSERT ON public.discussion_comments FOR EACH ROW EXECUTE FUNCTION public.dispatch_event_notifications();

-- ============================================================================
-- SQL VIEWS FOR PLATFORM OPERATIONS & ADMIN DASHBOARD
-- ============================================================================

-- 1. Admin Dashboard View
CREATE OR REPLACE VIEW public.v_admin_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM public.users) AS total_users,
    (SELECT COUNT(*) FROM public.problems WHERE status = 'published') AS total_published_problems,
    (SELECT COUNT(*) FROM public.submissions) AS total_submissions,
    (SELECT COUNT(*) FROM public.contests) AS total_contests,
    (SELECT COUNT(*) FROM public.courses) AS total_courses,
    (SELECT COUNT(*) FROM public.projects) AS total_projects;

-- 2. System Health View
CREATE OR REPLACE VIEW public.v_system_health AS
SELECT 
    (SELECT COUNT(*) FROM public.submissions WHERE submitted_at >= NOW() - INTERVAL '1 hour') AS submissions_last_hour,
    (SELECT COUNT(*) FROM public.audit_logs WHERE created_at >= NOW() - INTERVAL '24 hours') AS audit_events_24h,
    (SELECT COUNT(*) FROM public.feature_flags WHERE enabled = true) AS active_feature_flags;

-- 3. Platform Statistics View
CREATE OR REPLACE VIEW public.v_platform_statistics AS
SELECT 
    COUNT(DISTINCT u.id) AS total_registered_users,
    COUNT(DISTINCT sp.problem_id) AS total_solved_problem_pairs,
    COALESCE(SUM(u.xp), 0) AS platform_total_xp,
    COALESCE(ROUND(AVG(ls.acceptance_rate), 2), 0.00) AS avg_user_acceptance_rate
FROM public.users u
LEFT JOIN public.solved_problems sp ON u.id = sp.user_id
LEFT JOIN public.leaderboard_scores ls ON u.id = ls.user_id;

-- 4. Storage Usage View
CREATE OR REPLACE VIEW public.v_storage_usage AS
SELECT 
    bucket_id,
    COUNT(*) AS total_files,
    COALESCE(SUM(CAST(metadata->>'size' AS BIGINT)), 0) AS total_bytes
FROM storage.objects
GROUP BY bucket_id;

-- 5. Active Users View
CREATE OR REPLACE VIEW public.v_active_users AS
SELECT 
    u.id AS user_id,
    u.full_name,
    u.email,
    u.role_id,
    r.name AS role_name,
    u.xp,
    u.level,
    ds.current_streak,
    ds.last_submission_date
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
LEFT JOIN public.daily_streaks ds ON u.id = ds.user_id
WHERE ds.last_submission_date >= CURRENT_DATE - INTERVAL '7 days';

-- 6. Recent Activity View
CREATE OR REPLACE VIEW public.v_recent_activity AS
SELECT 
    s.id AS submission_id,
    s.user_id,
    u.full_name AS user_name,
    s.problem_id,
    p.title AS problem_title,
    s.verdict,
    s.submitted_at
FROM public.submissions s
JOIN public.users u ON s.user_id = u.id
JOIN public.problems p ON s.problem_id = p.id
ORDER BY s.submitted_at DESC
LIMIT 50;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;

-- Students Read Own Notifications
CREATE POLICY "Students read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Students update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id OR true);
CREATE POLICY "Students manage own notification preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Public read platform announcements" ON public.platform_announcements FOR SELECT USING (true);

-- Admins Only Policies
CREATE POLICY "Admins full CRUD on audit_logs" ON public.audit_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins full CRUD on system_settings" ON public.system_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins full CRUD on feature_flags" ON public.feature_flags FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('admin', 'super_admin'))
);
