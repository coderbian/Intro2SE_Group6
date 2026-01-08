import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdminClient } from '../config/supabase.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS, PROJECT_ROLES } from '../config/constants.js';
import logger from '../utils/logger.js';
import type { AuthenticatedRequest } from '../types/index.js';

// Type definitions for Supabase query results
interface ProjectData {
  id: string;
  owner_id: string | null;
  deleted_at: string | null;
}

interface MembershipData {
  role: string | null;
}

interface TaskData {
  id: string;
  project_id: string;
  reporter_id: string | null;
  deleted_at: string | null;
}

/**
 * Check if user is a member of the project
 */
export async function isProjectMember(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const projectId = req.params.projectId || req.params.id;

    if (!authReq.user) {
      return sendError(res, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    if (!projectId) {
      return sendError(res, 'Project ID required', HTTP_STATUS.BAD_REQUEST);
    }

    const supabase = getSupabaseAdminClient();

    // Check if project exists
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id, deleted_at')
      .eq('id', projectId)
      .single();

    const project = projectData as ProjectData | null;

    if (projectError || !project) {
      return sendError(res, 'Project not found', HTTP_STATUS.NOT_FOUND);
    }

    if (project.deleted_at) {
      return sendError(res, 'Project has been deleted', HTTP_STATUS.NOT_FOUND);
    }

    // Admin can access any project
    if (authReq.user.role === 'admin') {
      next();
      return;
    }

    // Check membership
    const { data: membershipData, error: memberError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', authReq.user.id)
      .single();

    const membership = membershipData as MembershipData | null;

    if (memberError || !membership) {
      return sendError(
        res,
        'You are not a member of this project',
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Attach project role to request for later use
    (req as any).projectRole = membership.role;
    next();
  } catch (error) {
    logger.error('Project membership check error', { error });
    return sendError(res, 'Failed to verify project access', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Check if user is a manager of the project
 */
export async function isProjectManager(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const projectId = req.params.projectId || req.params.id;

    if (!authReq.user) {
      return sendError(res, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    if (!projectId) {
      return sendError(res, 'Project ID required', HTTP_STATUS.BAD_REQUEST);
    }

    const supabase = getSupabaseAdminClient();

    // Check if project exists and user is owner
    const { data: projectData2, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id, deleted_at')
      .eq('id', projectId)
      .single();

    const project = projectData2 as ProjectData | null;

    if (projectError || !project) {
      return sendError(res, 'Project not found', HTTP_STATUS.NOT_FOUND);
    }

    if (project.deleted_at) {
      return sendError(res, 'Project has been deleted', HTTP_STATUS.NOT_FOUND);
    }

    // Admin can access any project as manager
    if (authReq.user.role === 'admin') {
      (req as any).projectRole = PROJECT_ROLES.MANAGER;
      next();
      return;
    }

    // Project owner is always a manager
    if (project.owner_id === authReq.user.id) {
      (req as any).projectRole = PROJECT_ROLES.MANAGER;
      next();
      return;
    }

    // Check membership with manager role
    const { data: membershipData2, error: memberError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', authReq.user.id)
      .single();

    const membership = membershipData2 as MembershipData | null;

    if (memberError || !membership) {
      return sendError(
        res,
        'You are not a member of this project',
        HTTP_STATUS.FORBIDDEN
      );
    }

    if (membership.role !== PROJECT_ROLES.MANAGER) {
      return sendError(
        res,
        'Manager access required for this action',
        HTTP_STATUS.FORBIDDEN
      );
    }

    (req as any).projectRole = membership.role;
    next();
  } catch (error) {
    logger.error('Project manager check error', { error });
    return sendError(res, 'Failed to verify project access', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Check if user is the project owner
 */
export async function isProjectOwner(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const projectId = req.params.projectId || req.params.id;

    if (!authReq.user) {
      return sendError(res, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    if (!projectId) {
      return sendError(res, 'Project ID required', HTTP_STATUS.BAD_REQUEST);
    }

    const supabase = getSupabaseAdminClient();

    const { data: projectData3, error } = await supabase
      .from('projects')
      .select('id, owner_id, deleted_at')
      .eq('id', projectId)
      .single();

    const project = projectData3 as ProjectData | null;

    if (error || !project) {
      return sendError(res, 'Project not found', HTTP_STATUS.NOT_FOUND);
    }

    // Admin can access as owner
    if (authReq.user.role === 'admin') {
      next();
      return;
    }

    if (project.owner_id !== authReq.user.id) {
      return sendError(
        res,
        'Only the project owner can perform this action',
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  } catch (error) {
    logger.error('Project owner check error', { error });
    return sendError(res, 'Failed to verify project ownership', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Check if user can edit a task
 * Managers can edit any task, members can only edit tasks they created or are assigned to
 */
export async function canEditTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const taskId = req.params.taskId || req.params.id;

    if (!authReq.user) {
      return sendError(res, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    if (!taskId) {
      return sendError(res, 'Task ID required', HTTP_STATUS.BAD_REQUEST);
    }

    const supabase = getSupabaseAdminClient();

    // Get task with project info
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('id, project_id, reporter_id, deleted_at')
      .eq('id', taskId)
      .single();

    const task = taskData as TaskData | null;

    if (taskError || !task) {
      return sendError(res, 'Task not found', HTTP_STATUS.NOT_FOUND);
    }

    if (task.deleted_at) {
      return sendError(res, 'Task has been deleted', HTTP_STATUS.NOT_FOUND);
    }

    // Admin can edit any task
    if (authReq.user.role === 'admin') {
      next();
      return;
    }

    // Check project membership
    const { data: membershipData3, error: memberError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', task.project_id)
      .eq('user_id', authReq.user.id)
      .single();

    const membership = membershipData3 as MembershipData | null;

    if (memberError || !membership) {
      return sendError(
        res,
        'You are not a member of this project',
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Managers can edit any task
    if (membership.role === PROJECT_ROLES.MANAGER) {
      next();
      return;
    }

    // Members can edit tasks they created
    if (task.reporter_id === authReq.user.id) {
      next();
      return;
    }

    // Check if user is assigned to the task
    const { data: assignment } = await supabase
      .from('task_assignees')
      .select('user_id')
      .eq('task_id', taskId)
      .eq('user_id', authReq.user.id)
      .single();

    if (assignment) {
      next();
      return;
    }

    return sendError(
      res,
      'You do not have permission to edit this task',
      HTTP_STATUS.FORBIDDEN
    );
  } catch (error) {
    logger.error('Task edit permission check error', { error });
    return sendError(res, 'Failed to verify task access', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export default {
  isProjectMember,
  isProjectManager,
  isProjectOwner,
  canEditTask,
};
