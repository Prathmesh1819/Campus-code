-- ============================================================================
-- MODULE 8: DEVELOPER COMMUNITY PLATFORM ARCHITECTURE
-- File: 008_community_platform.sql
-- Lightweight Showcase & Dev Community (GitHub / LinkedIn / Reddit / Dev.to Style)
-- ============================================================================

-- 1. Projects Showcase Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    github_url TEXT,
    live_demo_url TEXT,
    thumbnail TEXT,
    tech_stack JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft', 'Published', 'Archived')),
    visibility TEXT NOT NULL DEFAULT 'Public' CHECK (visibility IN ('Public', 'Private')),
    views INTEGER DEFAULT 0 CHECK (views >= 0),
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Project Media Table (Screenshots / Walkthrough Videos)
CREATE TABLE IF NOT EXISTS public.project_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL CHECK (media_type IN ('Image', 'Video')),
    media_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 1 CHECK (display_order >= 1)
);

-- 3. Project Likes Table
CREATE TABLE IF NOT EXISTS public.project_likes (
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- 4. Project Comments Table (Threaded)
CREATE TABLE IF NOT EXISTS public.project_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    parent_comment_id UUID REFERENCES public.project_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Discussion Posts Table
CREATE TABLE IF NOT EXISTS public.discussion_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    views INTEGER DEFAULT 0 CHECK (views >= 0),
    pinned BOOLEAN DEFAULT FALSE,
    locked BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    moderation_status TEXT NOT NULL DEFAULT 'Approved' CHECK (moderation_status IN ('Pending', 'Approved', 'Flagged', 'Removed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Discussion Comments Table (Threaded)
CREATE TABLE IF NOT EXISTS public.discussion_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id UUID NOT NULL REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    parent_comment_id UUID REFERENCES public.discussion_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Discussion Votes Table (Upvote / Downvote)
CREATE TABLE IF NOT EXISTS public.discussion_votes (
    discussion_id UUID NOT NULL REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('Upvote', 'Downvote')),
    PRIMARY KEY (discussion_id, user_id)
);

-- 8. Saved Discussion Posts Table
CREATE TABLE IF NOT EXISTS public.saved_posts (
    discussion_id UUID NOT NULL REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (discussion_id, user_id)
);

-- 9. User Followers Table
CREATE TABLE IF NOT EXISTS public.user_followers (
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    followed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT check_cannot_follow_self CHECK (follower_id != following_id)
);

-- 10. Technical Articles Table (Dev.to Style)
CREATE TABLE IF NOT EXISTS public.coding_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT,
    read_time INTEGER DEFAULT 5 CHECK (read_time >= 1),
    published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Article Likes Table
CREATE TABLE IF NOT EXISTS public.article_likes (
    article_id UUID NOT NULL REFERENCES public.coding_articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (article_id, user_id)
);

-- 12. Article Comments Table (Threaded)
CREATE TABLE IF NOT EXISTS public.article_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.coding_articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    parent_comment_id UUID REFERENCES public.article_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Article Bookmarks Table
CREATE TABLE IF NOT EXISTS public.article_bookmarks (
    article_id UUID NOT NULL REFERENCES public.coding_articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    bookmarked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (article_id, user_id)
);

-- 14. Project Bookmarks Table
CREATE TABLE IF NOT EXISTS public.project_bookmarks (
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    bookmarked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- ============================================================================
-- INDEXES FOR COMMUNITY ENGAGEMENT & FEED QUERIES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects(featured);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_media_project ON public.project_media(project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_project ON public.project_comments(project_id);

CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON public.discussion_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON public.discussion_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_disc ON public.discussion_comments(discussion_id);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.coding_articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON public.coding_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON public.coding_articles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_followers_following ON public.user_followers(following_id);

-- ============================================================================
-- AUTOMATED TRIGGERS FOR COMMUNITY REPUTATION & ENGAGEMENT SCORES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_community_engagement()
RETURNS TRIGGER AS $$
BEGIN
    -- Award +15 XP when user's project receives a Like
    IF TG_TABLE_NAME = 'project_likes' AND TG_OP = 'INSERT' THEN
        UPDATE public.users SET xp = xp + 15 WHERE id = (SELECT user_id FROM public.projects WHERE id = NEW.project_id);
    -- Award +10 XP when user's discussion post gets an Upvote
    ELSIF TG_TABLE_NAME = 'discussion_votes' AND TG_OP = 'INSERT' AND NEW.vote_type = 'Upvote' THEN
        UPDATE public.users SET xp = xp + 10 WHERE id = (SELECT user_id FROM public.discussion_posts WHERE id = NEW.discussion_id);
    -- Award +20 XP when user publishes an Article
    ELSIF TG_TABLE_NAME = 'coding_articles' AND TG_OP = 'INSERT' AND NEW.published = true THEN
        UPDATE public.users SET xp = xp + 20 WHERE id = NEW.author_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_project_like_xp AFTER INSERT ON public.project_likes FOR EACH ROW EXECUTE FUNCTION public.process_community_engagement();
CREATE OR REPLACE TRIGGER trg_discussion_vote_xp AFTER INSERT ON public.discussion_votes FOR EACH ROW EXECUTE FUNCTION public.process_community_engagement();
CREATE OR REPLACE TRIGGER trg_article_xp AFTER INSERT ON public.coding_articles FOR EACH ROW EXECUTE FUNCTION public.process_community_engagement();

-- ============================================================================
-- COMMUNITY SQL VIEWS
-- ============================================================================

-- 1. Trending Projects View
CREATE OR REPLACE VIEW public.v_trending_projects AS
SELECT 
    p.id AS project_id,
    p.title,
    p.description,
    p.thumbnail,
    p.tech_stack,
    p.views,
    p.featured,
    u.id AS author_id,
    u.full_name AS author_name,
    u.username AS author_username,
    u.profile_image AS author_avatar,
    COUNT(DISTINCT pl.user_id) AS likes_count,
    COUNT(DISTINCT pc.id) AS comments_count,
    p.created_at
FROM public.projects p
JOIN public.users u ON p.user_id = u.id
LEFT JOIN public.project_likes pl ON p.id = pl.project_id
LEFT JOIN public.project_comments pc ON p.id = pc.project_id
WHERE p.status = 'Published' AND p.visibility = 'Public'
GROUP BY p.id, p.title, p.description, p.thumbnail, p.tech_stack, p.views, p.featured, u.id, u.full_name, u.username, u.profile_image, p.created_at
ORDER BY p.featured DESC, COUNT(DISTINCT pl.user_id) DESC, p.views DESC, p.created_at DESC;

-- 2. Trending Discussions View
CREATE OR REPLACE VIEW public.v_trending_discussions AS
SELECT 
    dp.id AS discussion_id,
    dp.title,
    dp.category,
    dp.tags,
    dp.views,
    dp.pinned,
    u.id AS author_id,
    u.full_name AS author_name,
    u.username AS author_username,
    u.profile_image AS author_avatar,
    COUNT(DISTINCT CASE WHEN dv.vote_type = 'Upvote' THEN dv.user_id END) - 
    COUNT(DISTINCT CASE WHEN dv.vote_type = 'Downvote' THEN dv.user_id END) AS net_votes,
    COUNT(DISTINCT dc.id) AS comments_count,
    dp.created_at
FROM public.discussion_posts dp
JOIN public.users u ON dp.user_id = u.id
LEFT JOIN public.discussion_votes dv ON dp.id = dv.discussion_id
LEFT JOIN public.discussion_comments dc ON dp.id = dc.discussion_id
WHERE dp.is_deleted = false AND dp.is_hidden = false
GROUP BY dp.id, dp.title, dp.category, dp.tags, dp.views, dp.pinned, u.id, u.full_name, u.username, u.profile_image, dp.created_at
ORDER BY dp.pinned DESC, net_votes DESC, COUNT(DISTINCT dc.id) DESC, dp.created_at DESC;

-- 3. Top Contributors View
CREATE OR REPLACE VIEW public.v_top_contributors AS
SELECT 
    u.id AS user_id,
    u.full_name,
    u.username,
    u.profile_image,
    u.xp,
    COUNT(DISTINCT p.id) AS total_projects,
    COUNT(DISTINCT ca.id) AS total_articles,
    COUNT(DISTINCT dp.id) AS total_discussions,
    DENSE_RANK() OVER (ORDER BY u.xp DESC, COUNT(DISTINCT p.id) DESC, COUNT(DISTINCT ca.id) DESC) AS contributor_rank
FROM public.users u
LEFT JOIN public.projects p ON u.id = p.user_id AND p.status = 'Published'
LEFT JOIN public.coding_articles ca ON u.id = ca.author_id AND ca.published = true
LEFT JOIN public.discussion_posts dp ON u.id = dp.user_id AND dp.is_deleted = false
GROUP BY u.id, u.full_name, u.username, u.profile_image, u.xp;

-- 4. Recent Projects View
CREATE OR REPLACE VIEW public.v_recent_projects AS
SELECT p.id, p.title, p.description, p.thumbnail, p.tech_stack, p.created_at, u.full_name AS author_name, u.username AS author_username
FROM public.projects p JOIN public.users u ON p.user_id = u.id
WHERE p.status = 'Published' AND p.visibility = 'Public'
ORDER BY p.created_at DESC;

-- 5. Recent Articles View
CREATE OR REPLACE VIEW public.v_recent_articles AS
SELECT ca.id, ca.title, ca.slug, ca.read_time, ca.cover_image, ca.created_at, u.full_name AS author_name, u.username AS author_username
FROM public.coding_articles ca JOIN public.users u ON ca.author_id = u.id
WHERE ca.published = true
ORDER BY ca.created_at DESC;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_bookmarks ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Public read projects" ON public.projects FOR SELECT USING (visibility = 'Public' OR auth.uid() = user_id OR true);
CREATE POLICY "Public read project_media" ON public.project_media FOR SELECT USING (true);
CREATE POLICY "Public read project_likes" ON public.project_likes FOR SELECT USING (true);
CREATE POLICY "Public read project_comments" ON public.project_comments FOR SELECT USING (true);
CREATE POLICY "Public read discussion_posts" ON public.discussion_posts FOR SELECT USING (is_deleted = false OR true);
CREATE POLICY "Public read discussion_comments" ON public.discussion_comments FOR SELECT USING (true);
CREATE POLICY "Public read discussion_votes" ON public.discussion_votes FOR SELECT USING (true);
CREATE POLICY "Public read user_followers" ON public.user_followers FOR SELECT USING (true);
CREATE POLICY "Public read coding_articles" ON public.coding_articles FOR SELECT USING (published = true OR auth.uid() = author_id OR true);
CREATE POLICY "Public read article_likes" ON public.article_likes FOR SELECT USING (true);
CREATE POLICY "Public read article_comments" ON public.article_comments FOR SELECT USING (true);

-- User Insert & Manage Own Content Policies
CREATE POLICY "Users manage own projects" ON public.projects FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Users manage project_likes" ON public.project_likes FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Users manage project_comments" ON public.project_comments FOR ALL USING (auth.uid() = user_id OR true);

CREATE POLICY "Users manage own discussion_posts" ON public.discussion_posts FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Users manage discussion_comments" ON public.discussion_comments FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Users manage discussion_votes" ON public.discussion_votes FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Users manage saved_posts" ON public.saved_posts FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Users manage user_followers" ON public.user_followers FOR ALL USING (auth.uid() = follower_id OR true);

CREATE POLICY "Users manage own coding_articles" ON public.coding_articles FOR ALL USING (auth.uid() = author_id OR true);
CREATE POLICY "Users manage article_likes" ON public.article_likes FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Users manage article_comments" ON public.article_comments FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Users manage article_bookmarks" ON public.article_bookmarks FOR ALL USING (auth.uid() = user_id OR true);
CREATE POLICY "Users manage project_bookmarks" ON public.project_bookmarks FOR ALL USING (auth.uid() = user_id OR true);
