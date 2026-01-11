-- ============================================================================
-- DATABASE TRIGGERS FOR AUTOMATION
-- ============================================================================
-- Automatically create related records, send notifications, etc.
-- ============================================================================

-- ============================================================================
-- 1. AUTO-CREATE USER PROFILE AFTER AUTH SIGNUP
-- ============================================================================
-- This trigger creates a public.users record when someone signs up via Supabase Auth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    'user',
    'active'
  );
  
  -- Also create user preferences with defaults
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. AUTO-ADD PROJECT OWNER AS MEMBER
-- ============================================================================
-- When a project is created, automatically add the owner as a member with 'owner' role

CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_project();

-- ============================================================================
-- 3. SEND NOTIFICATION ON TASK ASSIGNMENT
-- ============================================================================
-- When a user is assigned to a task, create a notification

CREATE OR REPLACE FUNCTION public.handle_task_assignment()
RETURNS TRIGGER AS $$
DECLARE
  task_title TEXT;
  project_name TEXT;
BEGIN
  -- Get task and project info
  SELECT t.title, p.name INTO task_title, project_name
  FROM public.tasks t
  JOIN public.projects p ON p.id = t.project_id
  WHERE t.id = NEW.task_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message, entity_type, entity_id)
  VALUES (
    NEW.user_id,
    'task-assigned',
    'New Task Assignment',
    format('You have been assigned to task "%s" in project "%s"', task_title, project_name),
    'task',
    NEW.task_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_task_assigned
  AFTER INSERT ON public.task_assignees
  FOR EACH ROW EXECUTE FUNCTION public.handle_task_assignment();

-- ============================================================================
-- 4. LOG ACTIVITY ON TASK CHANGES
-- ============================================================================
-- Automatically create activity log entries when tasks are modified

CREATE OR REPLACE FUNCTION public.log_task_activity()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  changes_json JSONB;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    action_type := 'created';
    changes_json := to_jsonb(NEW);
    
  ELSIF (TG_OP = 'UPDATE') THEN
    action_type := 'updated';
    changes_json := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
    
  ELSIF (TG_OP = 'DELETE') THEN
    action_type := 'deleted';
    changes_json := to_jsonb(OLD);
  END IF;
  
  INSERT INTO public.activity_logs (project_id, user_id, action, entity_type, entity_id, changes)
  VALUES (
    COALESCE(NEW.project_id, OLD.project_id),
    auth.uid(),
    action_type,
    'task',
    COALESCE(NEW.id, OLD.id),
    changes_json
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER task_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_task_activity();

-- ============================================================================
-- 5. NOTIFY PROJECT MEMBERS ON NEW COMMENT
-- ============================================================================
-- When someone comments on a task, notify task assignees

CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  assignee_id UUID;
  task_title TEXT;
  commenter_name TEXT;
BEGIN
  -- Get task title and commenter name
  SELECT t.title INTO task_title
  FROM public.tasks t
  WHERE t.id = NEW.task_id;
  
  SELECT u.name INTO commenter_name
  FROM public.users u
  WHERE u.id = NEW.user_id;
  
  -- Notify all assignees (except the commenter)
  FOR assignee_id IN 
    SELECT user_id 
    FROM public.task_assignees 
    WHERE task_id = NEW.task_id AND user_id != NEW.user_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, entity_type, entity_id)
    VALUES (
      assignee_id,
      'comment',
      'New Comment',
      format('%s commented on task "%s"', commenter_name, task_title),
      'task',
      NEW.task_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment();

-- ============================================================================
-- 6. UPDATE PARENT TASK STATUS BASED ON SUBTASKS
-- ============================================================================
-- When all subtasks are done, mark parent task as done

CREATE OR REPLACE FUNCTION public.update_parent_task_status()
RETURNS TRIGGER AS $$
DECLARE
  parent_task_id UUID;
  total_subtasks INTEGER;
  completed_subtasks INTEGER;
BEGIN
  -- Get parent task ID
  parent_task_id := COALESCE(NEW.parent_id, OLD.parent_id);
  
  IF parent_task_id IS NOT NULL THEN
    -- Count subtasks
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'done')
    INTO total_subtasks, completed_subtasks
    FROM public.tasks
    WHERE parent_id = parent_task_id AND deleted_at IS NULL;
    
    -- Update parent status
    IF total_subtasks > 0 THEN
      IF completed_subtasks = total_subtasks THEN
        UPDATE public.tasks SET status = 'done' WHERE id = parent_task_id;
      ELSIF completed_subtasks > 0 THEN
        UPDATE public.tasks SET status = 'in-progress' WHERE id = parent_task_id;
      END IF;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_parent_on_subtask_change
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW 
  WHEN (NEW.parent_id IS NOT NULL OR OLD.parent_id IS NOT NULL)
  EXECUTE FUNCTION public.update_parent_task_status();

-- ============================================================================
-- 7. CALCULATE SPRINT VELOCITY ON SPRINT END
-- ============================================================================
-- When a sprint ends, calculate total story points completed

CREATE OR REPLACE FUNCTION public.calculate_sprint_velocity()
RETURNS TRIGGER AS $$
DECLARE
  total_points INTEGER;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Sum story points of completed tasks
    SELECT COALESCE(SUM(story_points), 0)
    INTO total_points
    FROM public.tasks
    WHERE sprint_id = NEW.id AND status = 'done' AND deleted_at IS NULL;
    
    -- Update sprint velocity
    UPDATE public.sprints
    SET velocity = total_points
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER calculate_velocity_on_sprint_end
  AFTER UPDATE ON public.sprints
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_sprint_velocity();

-- ============================================================================
-- 8. SOFT DELETE CASCADE FOR PROJECTS
-- ============================================================================
-- When a project is soft-deleted, also soft-delete all related tasks

CREATE OR REPLACE FUNCTION public.soft_delete_project_cascade()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    -- Soft delete all tasks in the project
    UPDATE public.tasks
    SET deleted_at = NOW()
    WHERE project_id = NEW.id AND deleted_at IS NULL;
    
    -- Soft delete all sprints
    UPDATE public.sprints
    SET deleted_at = NOW()
    WHERE project_id = NEW.id AND deleted_at IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_soft_delete
  AFTER UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.soft_delete_project_cascade();

-- ============================================================================
-- 9. CLEAN UP OLD NOTIFICATIONS
-- ============================================================================
-- Function to delete read notifications older than 30 days
-- Call this periodically via pg_cron or manually

CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.notifications
  WHERE read = TRUE 
    AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS SETUP COMPLETE
-- ============================================================================
-- All automation triggers are now active
-- The system will automatically:
-- - Create user profiles on signup
-- - Add project owners as members
-- - Send notifications on assignments and comments
-- - Log all activities
-- - Update parent tasks based on subtasks
-- - Calculate sprint velocity
-- ============================================================================
