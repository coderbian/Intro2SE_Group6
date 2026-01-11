-- ============================================================================
-- FIX INVITATION SYSTEM
-- ============================================================================
-- This migration consolidates all invitation-related fixes:
-- 1. Add request_type column to join_requests
-- 2. Fix RLS policies for notifications, join_requests, projects, and project_members
-- 3. Enable realtime for invitation tables
-- ============================================================================

-- Step 1: Add request_type column to join_requests
ALTER TABLE join_requests 
ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'invitation' 
CHECK (request_type IN ('invitation', 'request'));

-- Update existing records
UPDATE join_requests 
SET request_type = 'invitation' 
WHERE request_type IS NULL;

-- Step 2: Fix notifications RLS - allow authenticated users to create notifications for others
DROP POLICY IF EXISTS "Users can create their own notifications" ON notifications;
CREATE POLICY "Authenticated users can create notifications"
ON notifications FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Step 3: Fix join_requests RLS policies
DROP POLICY IF EXISTS "Users can read invitations sent to them" ON join_requests;
DROP POLICY IF EXISTS "Users can update their invitations" ON join_requests;
DROP POLICY IF EXISTS "Users can insert invitations" ON join_requests;

CREATE POLICY "Users can read invitations sent to them"
ON join_requests FOR SELECT
USING (
  auth.uid() = user_id 
  OR auth.uid() = invited_by
  OR auth.email() = email
);

CREATE POLICY "Users can update their invitations"
ON join_requests FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create invitations"
ON join_requests FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Step 4: Fix projects RLS - allow users with pending invitations to read project info
DROP POLICY IF EXISTS "Users can read their project info" ON projects;

CREATE POLICY "Users can read their project info"
ON projects FOR SELECT
USING (
  is_project_member(id)
  OR owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM join_requests
    WHERE join_requests.project_id = projects.id
    AND join_requests.user_id = auth.uid()
    AND join_requests.status = 'pending'
  )
);

-- Step 5: Fix project_members RLS - allow users to self-add when accepting invitations
DROP POLICY IF EXISTS "Managers can add members" ON project_members;

CREATE POLICY "Managers can add members OR users can accept invitations"
ON project_members FOR INSERT
WITH CHECK (
  -- Allow managers to add members
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
    AND pm.role = 'manager'
  )
  -- OR allow owners to add members
  OR EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_members.project_id
    AND p.owner_id = auth.uid()
  )
  -- OR allow users to self-add when they have pending invitation
  OR EXISTS (
    SELECT 1 FROM join_requests jr
    WHERE jr.project_id = project_members.project_id
    AND jr.user_id = auth.uid()
    AND jr.user_id = project_members.user_id
    AND jr.status = 'pending'
    AND jr.request_type = 'invitation'
  )
);

-- Step 6: Enable realtime for invitation-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE join_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE project_members;
