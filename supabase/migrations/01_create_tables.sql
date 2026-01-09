-- ============================================================================
-- PLANORA DATABASE SCHEMA - SUPABASE MIGRATION
-- ============================================================================
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
-- Note: Supabase Auth creates auth.users table automatically
-- We extend it with a public.users table for app-specific data

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. USER PREFERENCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  notifications JSONB DEFAULT '{"taskAssigned": true, "taskCompleted": true, "projectUpdates": true, "emailNotifications": true}'::jsonb,
  display JSONB DEFAULT '{"theme": "light", "language": "en"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  key TEXT UNIQUE NOT NULL, -- Project key (e.g., "PROJ", "DEV")
  template TEXT DEFAULT 'kanban' CHECK (template IN ('kanban', 'scrum')),
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  settings JSONB DEFAULT '{}'::jsonb,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE INDEX idx_projects_owner ON public.projects(owner_id);
CREATE INDEX idx_projects_key ON public.projects(key);
CREATE INDEX idx_projects_deleted_at ON public.projects(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. PROJECT MEMBERS TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.project_members (
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX idx_project_members_project ON public.project_members(project_id);
CREATE INDEX idx_project_members_user ON public.project_members(user_id);

-- ============================================================================
-- 5. JOIN REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email TEXT, -- For inviting non-registered users
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id),
  UNIQUE(project_id, email)
);

CREATE INDEX idx_join_requests_project ON public.join_requests(project_id);
CREATE INDEX idx_join_requests_user ON public.join_requests(user_id);
CREATE INDEX idx_join_requests_email ON public.join_requests(email);
CREATE INDEX idx_join_requests_status ON public.join_requests(status);

-- ============================================================================
-- 6. SPRINTS TABLE (Scrum)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed')),
  velocity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_sprints_project ON public.sprints(project_id);
CREATE INDEX idx_sprints_status ON public.sprints(status);

CREATE TRIGGER sprints_updated_at BEFORE UPDATE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. BOARDS TABLE (Kanban)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_boards_project ON public.boards(project_id);

CREATE TRIGGER boards_updated_at BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. LISTS TABLE (Kanban Columns)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('backlog', 'todo', 'in-progress', 'done')),
  position_index INTEGER DEFAULT 0,
  wip_limit INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lists_board ON public.lists(board_id);

CREATE TRIGGER lists_updated_at BEFORE UPDATE ON public.lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. TASKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'task' CHECK (type IN ('user-story', 'task', 'bug', 'epic')),
  status TEXT DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in-progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  story_points INTEGER CHECK (story_points >= 0 AND story_points <= 100),
  time_estimate INTEGER, -- in minutes
  time_spent INTEGER DEFAULT 0, -- in minutes
  position_index INTEGER DEFAULT 0,
  due_date TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_sprint ON public.tasks(sprint_id);
CREATE INDEX idx_tasks_parent ON public.tasks(parent_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX idx_tasks_deleted_at ON public.tasks(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. TASK ASSIGNEES TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.task_assignees (
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);

CREATE INDEX idx_task_assignees_task ON public.task_assignees(task_id);
CREATE INDEX idx_task_assignees_user ON public.task_assignees(user_id);

-- ============================================================================
-- 11. LABELS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL, -- Hex color code
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, name)
);

CREATE INDEX idx_labels_project ON public.labels(project_id);

CREATE TRIGGER labels_updated_at BEFORE UPDATE ON public.labels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 12. TASK LABELS TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.task_labels (
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  label_id UUID REFERENCES public.labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, label_id)
);

CREATE INDEX idx_task_labels_task ON public.task_labels(task_id);
CREATE INDEX idx_task_labels_label ON public.task_labels(label_id);

-- ============================================================================
-- 13. COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE, -- For nested comments
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_comments_task ON public.comments(task_id);
CREATE INDEX idx_comments_user ON public.comments(user_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);

CREATE TRIGGER comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 14. ATTACHMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL, -- Supabase Storage URL
  type TEXT NOT NULL, -- MIME type
  file_size INTEGER NOT NULL, -- in bytes
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_task ON public.attachments(task_id);
CREATE INDEX idx_attachments_comment ON public.attachments(comment_id);
CREATE INDEX idx_attachments_uploaded_by ON public.attachments(uploaded_by);

-- ============================================================================
-- 15. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('task-assigned', 'task-completed', 'mention', 'comment', 'project-invite', 'member-joined')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  entity_type TEXT, -- 'task', 'project', 'comment'
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================================================
-- 16. ACTIVITY LOGS TABLE (Audit Trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'moved'
  entity_type TEXT NOT NULL, -- 'task', 'project', 'sprint', etc.
  entity_id UUID NOT NULL,
  changes JSONB, -- Old and new values
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_project ON public.activity_logs(project_id);
CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- ============================================================================
-- 17. AI INTERACTIONS TABLE (Optional - for tracking AI usage)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'enhance', 'estimate', 'chat', 'suggest'
  input TEXT NOT NULL,
  output TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_interactions_user ON public.ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_type ON public.ai_interactions(type);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run 02_enable_rls.sql to enable Row Level Security
-- 2. Run 03_create_storage_buckets.sql to setup file storage
-- 3. Update your .env with SUPABASE_URL and keys
-- ============================================================================
