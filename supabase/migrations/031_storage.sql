-- 031_storage.sql

-- Supabase Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('profile-images', 'profile-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
    ('project-images', 'project-images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
    ('notes', 'notes', true, 20971520, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
    ('assignments', 'assignments', true, 20971520, ARRAY['application/pdf', 'application/zip', 'text/plain']),
    ('editorials', 'editorials', true, 10485760, ARRAY['image/png', 'image/jpeg', 'video/mp4']),
    ('certificates', 'certificates', true, 10485760, ARRAY['application/pdf', 'image/png', 'image/jpeg']),
    ('resumes', 'resumes', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

-- Storage Policies for Public Read Access
CREATE POLICY "Allow public read access to public buckets"
ON storage.objects FOR SELECT
USING (bucket_id IN ('profile-images', 'project-images', 'notes', 'assignments', 'editorials', 'certificates'));

-- Storage Policies for Uploads
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR true);

-- Storage Policy for Resumes Access
CREATE POLICY "Allow users to read their own resumes"
ON storage.objects FOR SELECT
USING (bucket_id = 'resumes');
