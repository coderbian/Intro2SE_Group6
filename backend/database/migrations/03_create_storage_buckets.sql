-- ============================================================================
-- SUPABASE STORAGE BUCKETS SETUP
-- ============================================================================
-- Run this in Supabase SQL Editor OR use Dashboard UI
-- For file uploads (attachments, avatars)
-- ============================================================================

-- ============================================================================
-- 1. CREATE STORAGE BUCKETS
-- ============================================================================
-- Note: You can also create these via Supabase Dashboard > Storage

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. STORAGE POLICIES FOR AVATARS BUCKET (PUBLIC)
-- ============================================================================

-- Anyone can view avatars
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- 3. STORAGE POLICIES FOR ATTACHMENTS BUCKET (PRIVATE)
-- ============================================================================

-- Project members can view attachments
CREATE POLICY "Members can view project attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attachments' AND
    EXISTS (
      SELECT 1 
      FROM public.attachments a
      JOIN public.tasks t ON a.task_id = t.id
      JOIN public.project_members pm ON pm.project_id = t.project_id
      WHERE a.url LIKE '%' || storage.objects.name || '%'
        AND pm.user_id = auth.uid()
    )
  );

-- Authenticated users can upload attachments
CREATE POLICY "Authenticated users can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'attachments' AND
    auth.role() = 'authenticated'
  );

-- Users can delete attachments they uploaded
CREATE POLICY "Users can delete own attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'attachments' AND
    EXISTS (
      SELECT 1 
      FROM public.attachments
      WHERE attachments.url LIKE '%' || storage.objects.name || '%'
        AND attachments.uploaded_by = auth.uid()
    )
  );

-- ============================================================================
-- 4. STORAGE CONFIGURATION
-- ============================================================================
-- Set file size limits (via Supabase Dashboard > Storage > Settings)
-- 
-- Recommended limits:
-- - avatars: 2MB max
-- - attachments: 10MB max
--
-- Allowed MIME types:
-- - avatars: image/jpeg, image/png, image/gif, image/webp
-- - attachments: All types (or restrict as needed)
--
-- These settings must be configured in the Supabase Dashboard
-- ============================================================================

-- ============================================================================
-- STORAGE SETUP COMPLETE
-- ============================================================================
-- Usage in backend:
--
-- const { data, error } = await supabase.storage
--   .from('attachments')
--   .upload(`${projectId}/${taskId}/${filename}`, file);
--
-- const { data } = await supabase.storage
--   .from('attachments')
--   .createSignedUrl(filePath, 3600); // 1 hour expiry
-- ============================================================================
