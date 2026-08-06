-- 011_companies.sql
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);

-- Default Seed Data
INSERT INTO public.companies (name) VALUES
    ('Google'),
    ('Meta'),
    ('Amazon'),
    ('Microsoft'),
    ('Apple'),
    ('Netflix'),
    ('Uber'),
    ('Adobe'),
    ('Oracle'),
    ('Goldman Sachs')
ON CONFLICT (name) DO NOTHING;

-- RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to companies" ON public.companies FOR SELECT USING (true);
