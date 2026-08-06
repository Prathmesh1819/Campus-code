-- 010_tags.sql
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.tags(slug);

-- Default Seed Data
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

-- RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to tags" ON public.tags FOR SELECT USING (true);
