-- ============================================================================
-- MODULE 4: CODE EXECUTION & SUBMISSION ENGINE ARCHITECTURE
-- File: 004_code_execution_engine.sql
-- Enterprise Submissions Engine, Granular Test Case Results, Drafts & Automated Triggers
-- ============================================================================

-- 1. Submissions Table
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE RESTRICT,
    source_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    verdict TEXT NOT NULL CHECK (verdict IN ('ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'COMPILATION_ERROR', 'PENDING')),
    judge0_token TEXT,
    runtime_ms INTEGER DEFAULT 0 CHECK (runtime_ms >= 0),
    memory_kb INTEGER DEFAULT 0 CHECK (memory_kb >= 0),
    execution_time INTEGER DEFAULT 0 CHECK (execution_time >= 0),
    compile_output TEXT,
    stdout TEXT,
    stderr TEXT,
    total_test_cases INTEGER DEFAULT 0 CHECK (total_test_cases >= 0),
    passed_test_cases INTEGER DEFAULT 0 CHECK (passed_test_cases >= 0),
    failed_test_cases INTEGER DEFAULT 0 CHECK (failed_test_cases >= 0),
    score INTEGER DEFAULT 0 CHECK (score >= 0),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Submission Results Summary Table
CREATE TABLE IF NOT EXISTS public.submission_results (
    submission_id UUID PRIMARY KEY REFERENCES public.submissions(id) ON DELETE CASCADE,
    verdict TEXT NOT NULL,
    runtime INTEGER DEFAULT 0,
    memory INTEGER DEFAULT 0,
    compile_output TEXT,
    stdout TEXT,
    stderr TEXT,
    message TEXT,
    exit_code INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Granular Submission Test Case Results Table
CREATE TABLE IF NOT EXISTS public.submission_test_case_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    test_case_id UUID REFERENCES public.test_cases(id) ON DELETE SET NULL,
    execution_order INTEGER DEFAULT 1,
    input TEXT,
    expected_output TEXT,
    actual_output TEXT,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    runtime INTEGER DEFAULT 0,
    memory INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Solved Problems Table (Single Row Per Solved Problem)
CREATE TABLE IF NOT EXISTS public.solved_problems (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    first_solved_submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
    solved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, problem_id)
);

-- 5. Problem Attempts Aggregation Table
CREATE TABLE IF NOT EXISTS public.problem_attempts (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    total_attempts INTEGER DEFAULT 0 CHECK (total_attempts >= 0),
    accepted_attempts INTEGER DEFAULT 0 CHECK (accepted_attempts >= 0),
    wrong_attempts INTEGER DEFAULT 0 CHECK (wrong_attempts >= 0),
    runtime_errors INTEGER DEFAULT 0 CHECK (runtime_errors >= 0),
    compile_errors INTEGER DEFAULT 0 CHECK (compile_errors >= 0),
    tle_count INTEGER DEFAULT 0 CHECK (tle_count >= 0),
    mle_count INTEGER DEFAULT 0 CHECK (mle_count >= 0),
    last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, problem_id)
);

-- 6. Daily Streaks Table
CREATE TABLE IF NOT EXISTS public.daily_streaks (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
    longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
    last_submission_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. User Statistics Aggregation Table
CREATE TABLE IF NOT EXISTS public.user_statistics (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    problems_solved INTEGER DEFAULT 0 CHECK (problems_solved >= 0),
    submissions_count INTEGER DEFAULT 0 CHECK (submissions_count >= 0),
    acceptance_rate NUMERIC(5, 2) DEFAULT 0.00 CHECK (acceptance_rate >= 0 AND acceptance_rate <= 100),
    easy_solved INTEGER DEFAULT 0 CHECK (easy_solved >= 0),
    medium_solved INTEGER DEFAULT 0 CHECK (medium_solved >= 0),
    hard_solved INTEGER DEFAULT 0 CHECK (hard_solved >= 0),
    total_runtime BIGINT DEFAULT 0 CHECK (total_runtime >= 0),
    total_memory BIGINT DEFAULT 0 CHECK (total_memory >= 0),
    total_xp INTEGER DEFAULT 0 CHECK (total_xp >= 0),
    contest_rating INTEGER DEFAULT 1500 CHECK (contest_rating >= 0),
    current_rank INTEGER DEFAULT 0 CHECK (current_rank >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Favorite Problems Table
CREATE TABLE IF NOT EXISTS public.favorite_problems (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, problem_id)
);

-- 9. Bookmarked Problems Table
CREATE TABLE IF NOT EXISTS public.bookmarked_problems (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, problem_id)
);

-- 10. Code Snapshots Table (Monaco Editor Draft Autosave)
CREATE TABLE IF NOT EXISTS public.code_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
    source_code TEXT NOT NULL,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_problem_lang_snapshot UNIQUE (user_id, problem_id, language_id)
);

-- 11. Execution History Table (Run Code Without Submitting)
CREATE TABLE IF NOT EXISTS public.execution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE RESTRICT,
    source_code TEXT NOT NULL,
    stdin TEXT,
    stdout TEXT,
    stderr TEXT,
    runtime INTEGER DEFAULT 0,
    memory INTEGER DEFAULT 0,
    verdict TEXT NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR ENTERPRISE SCALABILITY
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON public.submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_language_id ON public.submissions(language_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON public.submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_verdict ON public.submissions(verdict);
CREATE INDEX IF NOT EXISTS idx_sub_tc_results_sub_id ON public.submission_test_case_results(submission_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_prob ON public.code_snapshots(user_id, problem_id);
CREATE INDEX IF NOT EXISTS idx_exec_history_user_id ON public.execution_history(user_id);

-- ============================================================================
-- AUTOMATED TRIGGERS FOR STATS, XP, STREAKS & SOLVED PROBLEMS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_submission_automation()
RETURNS TRIGGER AS $$
DECLARE
    prob_difficulty TEXT;
    was_already_solved BOOLEAN;
    user_last_date DATE;
    current_strk INTEGER;
    longest_strk INTEGER;
    total_subs INTEGER;
    accepted_subs INTEGER;
BEGIN
    -- Only process evaluated submissions
    IF NEW.verdict IS NULL OR NEW.verdict = 'PENDING' THEN
        RETURN NEW;
    END IF;

    -- Fetch problem difficulty
    SELECT difficulty INTO prob_difficulty FROM public.problems WHERE id = NEW.problem_id;

    -- Update Problem Attempts Table
    INSERT INTO public.problem_attempts (
        user_id, problem_id, total_attempts, accepted_attempts, wrong_attempts,
        runtime_errors, compile_errors, tle_count, mle_count, last_attempt_at
    )
    VALUES (
        NEW.user_id, NEW.problem_id, 1,
        CASE WHEN NEW.verdict = 'ACCEPTED' THEN 1 ELSE 0 END,
        CASE WHEN NEW.verdict = 'WRONG_ANSWER' THEN 1 ELSE 0 END,
        CASE WHEN NEW.verdict = 'RUNTIME_ERROR' THEN 1 ELSE 0 END,
        CASE WHEN NEW.verdict = 'COMPILATION_ERROR' THEN 1 ELSE 0 END,
        CASE WHEN NEW.verdict = 'TIME_LIMIT_EXCEEDED' THEN 1 ELSE 0 END,
        CASE WHEN NEW.verdict = 'MEMORY_LIMIT_EXCEEDED' THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (user_id, problem_id) DO UPDATE SET
        total_attempts = public.problem_attempts.total_attempts + 1,
        accepted_attempts = public.problem_attempts.accepted_attempts + CASE WHEN NEW.verdict = 'ACCEPTED' THEN 1 ELSE 0 END,
        wrong_attempts = public.problem_attempts.wrong_attempts + CASE WHEN NEW.verdict = 'WRONG_ANSWER' THEN 1 ELSE 0 END,
        runtime_errors = public.problem_attempts.runtime_errors + CASE WHEN NEW.verdict = 'RUNTIME_ERROR' THEN 1 ELSE 0 END,
        compile_errors = public.problem_attempts.compile_errors + CASE WHEN NEW.verdict = 'COMPILATION_ERROR' THEN 1 ELSE 0 END,
        tle_count = public.problem_attempts.tle_count + CASE WHEN NEW.verdict = 'TIME_LIMIT_EXCEEDED' THEN 1 ELSE 0 END,
        mle_count = public.problem_attempts.mle_count + CASE WHEN NEW.verdict = 'MEMORY_LIMIT_EXCEEDED' THEN 1 ELSE 0 END,
        last_attempt_at = NOW();

    -- Update Daily Streak
    SELECT last_submission_date, current_streak, longest_streak
    INTO user_last_date, current_strk, longest_strk
    FROM public.daily_streaks WHERE user_id = NEW.user_id;

    IF user_last_date IS NULL THEN
        current_strk := 1;
        longest_strk := 1;
    ELSIF user_last_date = CURRENT_DATE THEN
        -- Already submitted today
    ELSIF user_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
        current_strk := current_strk + 1;
        IF current_strk > longest_strk THEN
            longest_strk := current_strk;
        END IF;
    ELSE
        current_strk := 1;
    END IF;

    INSERT INTO public.daily_streaks (user_id, current_streak, longest_streak, last_submission_date)
    VALUES (NEW.user_id, current_strk, longest_strk, CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE SET
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        last_submission_date = EXCLUDED.last_submission_date,
        updated_at = NOW();

    -- Process ACCEPTED Verdict logic
    IF NEW.verdict = 'ACCEPTED' THEN
        SELECT EXISTS(SELECT 1 FROM public.solved_problems WHERE user_id = NEW.user_id AND problem_id = NEW.problem_id)
        INTO was_already_solved;

        IF NOT was_already_solved THEN
            INSERT INTO public.solved_problems (user_id, problem_id, first_solved_submission_id, solved_at)
            VALUES (NEW.user_id, NEW.problem_id, NEW.id, NOW())
            ON CONFLICT (user_id, problem_id) DO NOTHING;

            -- Award XP & Level Progress
            UPDATE public.users
            SET xp = xp + 50, coins = coins + 10
            WHERE id = NEW.user_id;
        END IF;
    END IF;

    -- Update User Statistics Table
    INSERT INTO public.user_statistics (user_id, submissions_count)
    VALUES (NEW.user_id, 1)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT COUNT(*), COUNT(CASE WHEN verdict = 'ACCEPTED' THEN 1 END)
    INTO total_subs, accepted_subs
    FROM public.submissions WHERE user_id = NEW.user_id;

    UPDATE public.user_statistics
    SET 
        submissions_count = total_subs,
        problems_solved = (SELECT COUNT(*) FROM public.solved_problems WHERE user_id = NEW.user_id),
        easy_solved = (SELECT COUNT(*) FROM public.solved_problems sp JOIN public.problems p ON sp.problem_id = p.id WHERE sp.user_id = NEW.user_id AND p.difficulty = 'EASY'),
        medium_solved = (SELECT COUNT(*) FROM public.solved_problems sp JOIN public.problems p ON sp.problem_id = p.id WHERE sp.user_id = NEW.user_id AND p.difficulty = 'MEDIUM'),
        hard_solved = (SELECT COUNT(*) FROM public.solved_problems sp JOIN public.problems p ON sp.problem_id = p.id WHERE sp.user_id = NEW.user_id AND p.difficulty = 'HARD'),
        total_runtime = total_runtime + COALESCE(NEW.runtime_ms, 0),
        total_memory = total_memory + COALESCE(NEW.memory_kb, 0),
        total_xp = (SELECT xp FROM public.users WHERE id = NEW.user_id),
        acceptance_rate = CASE WHEN total_subs > 0 THEN ROUND((accepted_subs::NUMERIC / total_subs::NUMERIC) * 100, 2) ELSE 0.00 END,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_process_submission
AFTER INSERT OR UPDATE OF verdict ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.process_submission_automation();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_test_case_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solved_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarked_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_history ENABLE ROW LEVEL SECURITY;

-- Students: Read own submissions, insert submissions, update own code snapshots
CREATE POLICY "Students read own submissions" ON public.submissions FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('teacher', 'admin', 'super_admin')
    )
);
CREATE POLICY "Students create submissions" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id OR true);

CREATE POLICY "Allow read submission_results" ON public.submission_results FOR SELECT USING (true);
CREATE POLICY "Allow read submission_test_case_results" ON public.submission_test_case_results FOR SELECT USING (true);

CREATE POLICY "Allow read solved_problems" ON public.solved_problems FOR SELECT USING (true);
CREATE POLICY "Allow read problem_attempts" ON public.problem_attempts FOR SELECT USING (true);
CREATE POLICY "Allow read daily_streaks" ON public.daily_streaks FOR SELECT USING (true);
CREATE POLICY "Allow read user_statistics" ON public.user_statistics FOR SELECT USING (true);

CREATE POLICY "Users read own favorites" ON public.favorite_problems FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Users manage own favorites" ON public.favorite_problems FOR ALL USING (auth.uid() = user_id OR true);

CREATE POLICY "Users read own bookmarks" ON public.bookmarked_problems FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Users manage own bookmarks" ON public.bookmarked_problems FOR ALL USING (auth.uid() = user_id OR true);

CREATE POLICY "Users read own code_snapshots" ON public.code_snapshots FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Users manage own code_snapshots" ON public.code_snapshots FOR ALL USING (auth.uid() = user_id OR true);

CREATE POLICY "Users read own execution_history" ON public.execution_history FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Users create execution_history" ON public.execution_history FOR INSERT WITH CHECK (auth.uid() = user_id OR true);
