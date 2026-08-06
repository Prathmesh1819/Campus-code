-- ============================================================================
-- MODULE 3: PROBLEM RESOURCES ARCHITECTURE
-- File: 003_problem_resources.sql
-- Scalable Problem Assets, Templates, Multi-Examples & Test Cases
-- ============================================================================

-- 1. Starter Codes Table
CREATE TABLE IF NOT EXISTS public.starter_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
    starter_code TEXT NOT NULL,
    is_default_language BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_problem_language_starter UNIQUE (problem_id, language_id)
);

-- 2. Hidden Evaluation Test Cases Table
CREATE TABLE IF NOT EXISTS public.test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT TRUE,
    weight INTEGER DEFAULT 1 CHECK (weight >= 0),
    execution_order INTEGER DEFAULT 1 CHECK (execution_order >= 1),
    timeout_override INTEGER, -- in milliseconds
    memory_override INTEGER,  -- in KB
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Visible Sample Test Cases Table
CREATE TABLE IF NOT EXISTS public.sample_test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Code Templates Table
CREATE TABLE IF NOT EXISTS public.code_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
    function_signature TEXT NOT NULL,
    wrapper_required BOOLEAN DEFAULT TRUE,
    template_version INTEGER DEFAULT 1 CHECK (template_version >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_problem_language_template UNIQUE (problem_id, language_id)
);

-- 5. Constraints Reference Table
CREATE TABLE IF NOT EXISTS public.constraints_reference (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    constraint_text TEXT NOT NULL,
    order_index INTEGER DEFAULT 1 CHECK (order_index >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Examples Table
CREATE TABLE IF NOT EXISTS public.examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    example_number INTEGER NOT NULL CHECK (example_number >= 1),
    input TEXT NOT NULL,
    output TEXT NOT NULL,
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_problem_example_number UNIQUE (problem_id, example_number)
);

-- 7. Editorials Table
CREATE TABLE IF NOT EXISTS public.editorials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL UNIQUE REFERENCES public.problems(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    estimated_read_time INTEGER DEFAULT 5 CHECK (estimated_read_time >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Hints Table
CREATE TABLE IF NOT EXISTS public.hints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    hint_order INTEGER NOT NULL CHECK (hint_order >= 1),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_problem_hint_order UNIQUE (problem_id, hint_order)
);

-- ============================================================================
-- INDEXES FOR FREQUENTLY QUERIED COLUMNS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_starter_codes_problem_id ON public.starter_codes(problem_id);
CREATE INDEX IF NOT EXISTS idx_starter_codes_language_id ON public.starter_codes(language_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_problem_id ON public.test_cases(problem_id);
CREATE INDEX IF NOT EXISTS idx_sample_test_cases_problem_id ON public.sample_test_cases(problem_id);
CREATE INDEX IF NOT EXISTS idx_code_templates_problem_id ON public.code_templates(problem_id);
CREATE INDEX IF NOT EXISTS idx_code_templates_language_id ON public.code_templates(language_id);
CREATE INDEX IF NOT EXISTS idx_constraints_ref_problem_id ON public.constraints_reference(problem_id);
CREATE INDEX IF NOT EXISTS idx_examples_problem_id ON public.examples(problem_id);
CREATE INDEX IF NOT EXISTS idx_examples_example_number ON public.examples(example_number);
CREATE INDEX IF NOT EXISTS idx_editorials_problem_id ON public.editorials(problem_id);
CREATE INDEX IF NOT EXISTS idx_hints_problem_id ON public.hints(problem_id);
CREATE INDEX IF NOT EXISTS idx_hints_hint_order ON public.hints(hint_order);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.starter_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constraints_reference ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hints ENABLE ROW LEVEL SECURITY;

-- Student / Public Read Policies
CREATE POLICY "Allow public read on starter_codes" ON public.starter_codes FOR SELECT USING (true);
CREATE POLICY "Allow public read on sample_test_cases" ON public.sample_test_cases FOR SELECT USING (true);
CREATE POLICY "Allow public read on code_templates" ON public.code_templates FOR SELECT USING (true);
CREATE POLICY "Allow public read on constraints_reference" ON public.constraints_reference FOR SELECT USING (true);
CREATE POLICY "Allow public read on examples" ON public.examples FOR SELECT USING (true);
CREATE POLICY "Allow public read on editorials" ON public.editorials FOR SELECT USING (true);
CREATE POLICY "Allow public read on hints" ON public.hints FOR SELECT USING (true);

-- Restricted Hidden Test Cases Read Policy
CREATE POLICY "Allow non-hidden test cases read or staff read" ON public.test_cases FOR SELECT USING (
    is_hidden = false OR EXISTS (
        SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('teacher', 'admin', 'super_admin')
    )
);

-- Teacher & Admin Full CRUD Policies
CREATE POLICY "Allow staff to manage starter_codes" ON public.starter_codes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('teacher', 'admin', 'super_admin'))
);
CREATE POLICY "Allow staff to manage test_cases" ON public.test_cases FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('teacher', 'admin', 'super_admin'))
);
CREATE POLICY "Allow staff to manage sample_test_cases" ON public.sample_test_cases FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('teacher', 'admin', 'super_admin'))
);
CREATE POLICY "Allow staff to manage code_templates" ON public.code_templates FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('teacher', 'admin', 'super_admin'))
);
CREATE POLICY "Allow staff to manage constraints_reference" ON public.constraints_reference FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('teacher', 'admin', 'super_admin'))
);
CREATE POLICY "Allow staff to manage examples" ON public.examples FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('teacher', 'admin', 'super_admin'))
);
CREATE POLICY "Allow staff to manage editorials" ON public.editorials FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('teacher', 'admin', 'super_admin'))
);
CREATE POLICY "Allow staff to manage hints" ON public.hints FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('teacher', 'admin', 'super_admin'))
);
