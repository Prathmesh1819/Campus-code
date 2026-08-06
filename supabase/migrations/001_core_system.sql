-- ============================================================================
-- MODULE 1: CORE SYSTEM & RBAC ARCHITECTURE
-- File: 001_core_system.sql
-- 3NF Normalized Schema for Users, Roles, and Academic Hierarchy
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL CHECK (name IN ('student', 'teacher', 'admin', 'super_admin')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Streams Table
CREATE TABLE IF NOT EXISTS public.streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Semesters Table
CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INTEGER NOT NULL CHECK (number >= 1 AND number <= 8),
    academic_year TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_semester_year UNIQUE (number, academic_year)
);

-- 5. Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID REFERENCES public.streams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    year TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Core Users Table (3NF)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE,
    roll_number TEXT UNIQUE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    stream_id UUID REFERENCES public.streams(id) ON DELETE SET NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    profile_image TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    bio TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    resume_url TEXT,
    xp INTEGER DEFAULT 0 CHECK (xp >= 0),
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    coins INTEGER DEFAULT 0 CHECK (coins >= 0),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR 100,000+ USER SCALABILITY
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_dept_class ON public.users(department_id, class_id);
CREATE INDEX IF NOT EXISTS idx_streams_dept ON public.streams(department_id);
CREATE INDEX IF NOT EXISTS idx_classes_stream ON public.classes(stream_id);

-- ============================================================================
-- ESSENTIAL SEED DATA
-- ============================================================================
INSERT INTO public.roles (name, description) VALUES
    ('student', 'Student account for learning, solving problems, and competing'),
    ('teacher', 'Teacher account for creating notes, assignments, and managing classes'),
    ('admin', 'Department Administrator account'),
    ('super_admin', 'System Super Administrator account')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to roles" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Allow public read access to departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow public read access to streams" ON public.streams FOR SELECT USING (true);
CREATE POLICY "Allow public read access to semesters" ON public.semesters FOR SELECT USING (true);
CREATE POLICY "Allow public read access to classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT USING (true);

CREATE POLICY "Allow users to update own profile" ON public.users FOR UPDATE
    USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.id = auth.uid() AND r.name IN ('admin', 'super_admin')
    ));

CREATE POLICY "Allow user registration" ON public.users FOR INSERT WITH CHECK (true);
