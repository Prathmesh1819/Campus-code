-- 015_problem_companies.sql
CREATE TABLE IF NOT EXISTS public.problem_companies (
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    PRIMARY KEY (problem_id, company_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_problem_companies_problem_id ON public.problem_companies(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_companies_company_id ON public.problem_companies(company_id);

-- RLS
ALTER TABLE public.problem_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on problem_companies" ON public.problem_companies FOR SELECT USING (true);
CREATE POLICY "Allow admins to manage problem_companies" ON public.problem_companies FOR ALL USING (true);
