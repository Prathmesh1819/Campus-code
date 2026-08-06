-- 027_community.sql

-- Projects Showcase
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

-- Project Likes
CREATE TABLE IF NOT EXISTS public.project_likes (
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- Project Comments
CREATE TABLE IF NOT EXISTS public.project_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Discussion Posts
CREATE TABLE IF NOT EXISTS public.discussion_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Discussion Replies
CREATE TABLE IF NOT EXISTS public.discussion_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- General Bookmarks
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Moderation Reports
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('project', 'post', 'comment', 'reply', 'user')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_student_id ON public.projects(student_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_project_id ON public.project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_problem_id ON public.discussion_posts(problem_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_post_id ON public.discussion_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow student insert projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = student_id OR true);
CREATE POLICY "Allow student manage projects" ON public.projects FOR ALL USING (auth.uid() = student_id OR true);

CREATE POLICY "Allow read project_likes" ON public.project_likes FOR SELECT USING (true);
CREATE POLICY "Allow insert project_likes" ON public.project_likes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read project_comments" ON public.project_comments FOR SELECT USING (true);
CREATE POLICY "Allow insert project_comments" ON public.project_comments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read discussion_posts" ON public.discussion_posts FOR SELECT USING (true);
CREATE POLICY "Allow insert discussion_posts" ON public.discussion_posts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read discussion_replies" ON public.discussion_replies FOR SELECT USING (true);
CREATE POLICY "Allow insert discussion_replies" ON public.discussion_replies FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read bookmarks" ON public.bookmarks FOR SELECT USING (true);
CREATE POLICY "Allow insert bookmarks" ON public.bookmarks FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read reports" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Allow insert reports" ON public.reports FOR INSERT WITH CHECK (true);
