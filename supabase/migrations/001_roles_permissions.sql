-- 001_roles_permissions.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL CHECK (name IN ('student', 'teacher', 'admin', 'super_admin')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Role-Permissions Junction Table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON public.permissions(code);

-- Seed System Roles
INSERT INTO public.roles (name, description) VALUES
    ('student', 'Student role for solving problems, entering contests, and managing profile'),
    ('teacher', 'Teacher role for managing notes, assignments, and viewing student progress'),
    ('admin', 'Administrator role for managing problems, users, and platform settings'),
    ('super_admin', 'Super Admin role with unrestricted platform access')
ON CONFLICT (name) DO NOTHING;

-- RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on roles" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Allow public read on permissions" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "Allow public read on role_permissions" ON public.role_permissions FOR SELECT USING (true);
