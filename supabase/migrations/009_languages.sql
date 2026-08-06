-- 009_languages.sql
CREATE TABLE IF NOT EXISTS public.languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    judge0_id INTEGER NOT NULL,
    version TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_languages_name ON public.languages(name);

-- Default Data
INSERT INTO public.languages (name, judge0_id, version) VALUES
    ('Java', 62, 'JDK 17.0.6'),
    ('C', 50, 'GCC 9.2.0'),
    ('C++', 54, 'GCC 9.2.0'),
    ('Python', 71, '3.8.1'),
    ('JavaScript', 63, 'Node.js 12.14.0'),
    ('TypeScript', 74, '3.7.4'),
    ('Kotlin', 78, '1.3.70'),
    ('Rust', 73, '1.40.0'),
    ('Go', 60, '1.13.5'),
    ('SQL', 82, 'SQLite 3.31.1')
ON CONFLICT (name) DO NOTHING;

-- RLS
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to languages" ON public.languages FOR SELECT USING (true);
