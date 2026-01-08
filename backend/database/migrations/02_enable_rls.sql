-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Run this AFTER running 01_create_tables.sql
-- RLS ensures users can only access data they're authorized to see
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is project member
CREATE OR REPLACE FUNCTION is_project_member(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = project_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is project manager or owner
CREATE OR REPLACE FUNCTION is_project_manager(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = project_uuid 
      AND user_id = auth.uid() 
      AND role IN ('manager', 'owner')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is project owner
CREATE OR REPLACE FUNCTION is_project_owner(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = project_uuid AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR is_admin());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (is_admin());

-- Allow users to be created (by auth triggers)
CREATE POLICY "Users can be inserted"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- USER PREFERENCES POLICIES
-- ============================================================================

CREATE POLICY "Users can manage own preferences"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PROJECTS TABLE POLICIES
-- ============================================================================

-- Users can view projects they're members of
CREATE POLICY "Members can view project"
  ON public.projects FOR SELECT
  USING (
    is_project_member(id) OR 
    is_admin() OR 
    visibility = 'public'
  );

-- Users can create projects
CREATE POLICY "Users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Managers can update projects
CREATE POLICY "Managers can update projects"
  ON public.projects FOR UPDATE
  USING (is_project_manager(id))
  WITH CHECK (is_project_manager(id));

-- Owners can delete projects
CREATE POLICY "Owners can delete projects"
  ON public.projects FOR DELETE
  USING (is_project_owner(id));

-- ============================================================================
-- PROJECT MEMBERS POLICIES
-- ============================================================================

-- Members can view other members in their projects
CREATE POLICY "Members can view project members"
  ON public.project_members FOR SELECT
  USING (is_project_member(project_id));

-- Managers can add members
CREATE POLICY "Managers can add members"
  ON public.project_members FOR INSERT
  WITH CHECK (is_project_manager(project_id));

-- Managers can remove members
CREATE POLICY "Managers can remove members"
  ON public.project_members FOR DELETE
  USING (is_project_manager(project_id));

-- Managers can update member roles
CREATE POLICY "Managers can update member roles"
  ON public.project_members FOR UPDATE
  USING (is_project_manager(project_id))
  WITH CHECK (is_project_manager(project_id));

-- ============================================================================
-- JOIN REQUESTS POLICIES
-- ============================================================================

-- Users can view invitations sent to them
CREATE POLICY "Users can view own invitations"
  ON public.join_requests FOR SELECT
  USING (user_id = auth.uid() OR email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- Managers can view project invitations
CREATE POLICY "Managers can view project invitations"
  ON public.join_requests FOR SELECT
  USING (is_project_manager(project_id));

-- Managers can create invitations
CREATE POLICY "Managers can create invitations"
  ON public.join_requests FOR INSERT
  WITH CHECK (is_project_manager(project_id));

-- Users can respond to their own invitations
CREATE POLICY "Users can respond to invitations"
  ON public.join_requests FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TASKS TABLE POLICIES
-- ============================================================================

-- Members can view tasks in their projects
CREATE POLICY "Members can view tasks"
  ON public.tasks FOR SELECT
  USING (is_project_member(project_id));

-- Members can create tasks
CREATE POLICY "Members can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (is_project_member(project_id));

-- Members can update tasks in their projects
CREATE POLICY "Members can update tasks"
  ON public.tasks FOR UPDATE
  USING (is_project_member(project_id))
  WITH CHECK (is_project_member(project_id));

-- Managers can delete tasks
CREATE POLICY "Managers can delete tasks"
  ON public.tasks FOR DELETE
  USING (is_project_manager(project_id));

-- ============================================================================
-- TASK ASSIGNEES POLICIES
-- ============================================================================

CREATE POLICY "Members can manage task assignees"
  ON public.task_assignees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_assignees.task_id
        AND is_project_member(tasks.project_id)
    )
  );

-- ============================================================================
-- SPRINTS POLICIES
-- ============================================================================

CREATE POLICY "Members can view sprints"
  ON public.sprints FOR SELECT
  USING (is_project_member(project_id));

CREATE POLICY "Managers can manage sprints"
  ON public.sprints FOR ALL
  USING (is_project_manager(project_id))
  WITH CHECK (is_project_manager(project_id));

-- ============================================================================
-- BOARDS & LISTS POLICIES
-- ============================================================================

CREATE POLICY "Members can view boards"
  ON public.boards FOR SELECT
  USING (is_project_member(project_id));

CREATE POLICY "Managers can manage boards"
  ON public.boards FOR ALL
  USING (is_project_manager(project_id))
  WITH CHECK (is_project_manager(project_id));

CREATE POLICY "Members can view lists"
  ON public.lists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = lists.board_id
        AND is_project_member(boards.project_id)
    )
  );

CREATE POLICY "Managers can manage lists"
  ON public.lists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = lists.board_id
        AND is_project_manager(boards.project_id)
    )
  );

-- ============================================================================
-- LABELS POLICIES
-- ============================================================================

CREATE POLICY "Members can view labels"
  ON public.labels FOR SELECT
  USING (is_project_member(project_id));

CREATE POLICY "Members can manage labels"
  ON public.labels FOR ALL
  USING (is_project_member(project_id))
  WITH CHECK (is_project_member(project_id));

CREATE POLICY "Members can manage task labels"
  ON public.task_labels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_labels.task_id
        AND is_project_member(tasks.project_id)
    )
  );

-- ============================================================================
-- COMMENTS POLICIES
-- ============================================================================

CREATE POLICY "Members can view comments"
  ON public.comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = comments.task_id
        AND is_project_member(tasks.project_id)
    )
  );

CREATE POLICY "Members can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = comments.task_id
        AND is_project_member(tasks.project_id)
    )
  );

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ATTACHMENTS POLICIES
-- ============================================================================

CREATE POLICY "Members can view attachments"
  ON public.attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = attachments.task_id
        AND is_project_member(tasks.project_id)
    )
  );

CREATE POLICY "Members can upload attachments"
  ON public.attachments FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = attachments.task_id
        AND is_project_member(tasks.project_id)
    )
  );

CREATE POLICY "Uploaders can delete attachments"
  ON public.attachments FOR DELETE
  USING (auth.uid() = uploaded_by);

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can manage own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ACTIVITY LOGS POLICIES
-- ============================================================================

CREATE POLICY "Members can view activity logs"
  ON public.activity_logs FOR SELECT
  USING (is_project_member(project_id) OR is_admin());

CREATE POLICY "System can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (true); -- Allow backend service role to insert

-- ============================================================================
-- AI INTERACTIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own AI interactions"
  ON public.ai_interactions FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "System can insert AI interactions"
  ON public.ai_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RLS SETUP COMPLETE
-- ============================================================================
-- All tables now have Row Level Security enabled
-- Users can only access data they're authorized to see
-- Backend with service_role key bypasses RLS for admin operations
-- ============================================================================
