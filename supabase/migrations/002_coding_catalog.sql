-- ============================================================================
-- MODULE 2: CODING CATALOG ARCHITECTURE
-- File: 002_coding_catalog.sql
-- 3NF Normalized Problem Definitions & Catalog Junctions
-- ============================================================================

-- 1. Languages Table
CREATE TABLE IF NOT EXISTS public.languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    judge0_id INTEGER NOT NULL,
    version TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Problems Table
CREATE TABLE IF NOT EXISTS public.problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    description TEXT NOT NULL,
    constraints TEXT NOT NULL,
    acceptance_rate NUMERIC(5, 2) DEFAULT 0.00 CHECK (acceptance_rate >= 0 AND acceptance_rate <= 100),
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Problem Metadata Table
CREATE TABLE IF NOT EXISTS public.problem_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL UNIQUE REFERENCES public.problems(id) ON DELETE CASCADE,
    function_name TEXT NOT NULL,
    return_type TEXT NOT NULL,
    parameters JSONB NOT NULL DEFAULT '[]'::jsonb,
    wrapper_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Problem-Tags Junction Table
CREATE TABLE IF NOT EXISTS public.problem_tags (
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (problem_id, tag_id)
);

-- 7. Problem-Companies Junction Table
CREATE TABLE IF NOT EXISTS public.problem_companies (
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (problem_id, company_id)
);

-- 8. Problem-Languages Junction Table
CREATE TABLE IF NOT EXISTS public.problem_languages (
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (problem_id, language_id)
);

-- ============================================================================
-- FREQUENTLY QUERIED COLUMN INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_languages_slug ON public.languages(slug);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.tags(slug);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_problems_slug ON public.problems(slug);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON public.problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problem_metadata_problem_id ON public.problem_metadata(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_tags_tag_id ON public.problem_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_problem_companies_company_id ON public.problem_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_problem_languages_language_id ON public.problem_languages(language_id);

-- ============================================================================
-- ESSENTIAL SEED DATA
-- ============================================================================

-- Languages
INSERT INTO public.languages (name, slug, judge0_id, version) VALUES
    ('Java', 'java', 62, 'JDK 17.0.6'),
    ('C', 'c', 50, 'GCC 9.2.0'),
    ('C++', 'cpp', 54, 'GCC 9.2.0'),
    ('JavaScript', 'javascript', 63, 'Node.js 12.14.0'),
    ('TypeScript', 'typescript', 74, '3.7.4'),
    ('Python', 'python', 71, '3.8.1'),
    ('Kotlin', 'kotlin', 78, '1.3.70'),
    ('Go', 'go', 60, '1.13.5'),
    ('Rust', 'rust', 73, '1.40.0'),
    ('SQL', 'sql', 82, 'SQLite 3.31.1')
ON CONFLICT (name) DO NOTHING;

-- Tags
INSERT INTO public.tags (name, slug) VALUES
    ('Array', 'array'),
    ('String', 'string'),
    ('Math', 'math'),
    ('Greedy', 'greedy'),
    ('DP', 'dp'),
    ('Graph', 'graph'),
    ('Tree', 'tree'),
    ('Binary Tree', 'binary-tree'),
    ('Trie', 'trie'),
    ('Heap', 'heap'),
    ('HashMap', 'hashmap'),
    ('Sorting', 'sorting'),
    ('Searching', 'searching'),
    ('Backtracking', 'backtracking'),
    ('Bit Manipulation', 'bit-manipulation')
ON CONFLICT (name) DO NOTHING;

-- Major Companies
INSERT INTO public.companies (name, slug) VALUES
    ('Google', 'google'),
    ('Meta', 'meta'),
    ('Amazon', 'amazon'),
    ('Microsoft', 'microsoft'),
    ('Apple', 'apple'),
    ('Netflix', 'netflix'),
    ('Uber', 'uber'),
    ('Adobe', 'adobe'),
    ('Oracle', 'oracle'),
    ('Goldman Sachs', 'goldman-sachs')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on languages" ON public.languages FOR SELECT USING (true);
CREATE POLICY "Allow public read on tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Allow public read on companies" ON public.companies FOR SELECT USING (true);

CREATE POLICY "Allow public read on published problems" ON public.problems FOR SELECT USING (
    status = 'published' OR EXISTS (
        SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Allow public read on problem_metadata" ON public.problem_metadata FOR SELECT USING (true);
CREATE POLICY "Allow public read on problem_tags" ON public.problem_tags FOR SELECT USING (true);
CREATE POLICY "Allow public read on problem_companies" ON public.problem_companies FOR SELECT USING (true);
CREATE POLICY "Allow public read on problem_languages" ON public.problem_languages FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage catalog" ON public.problems FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('admin', 'super_admin'))
);
