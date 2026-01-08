import { Response } from 'express';
import * as taskService from './task.service.js';
import { sendSuccess, sendCreated, sendError, sendNoContent } from '../../utils/response.js';
import { HTTP_STATUS } from '../../config/constants.js';
import logger from '../../utils/logger.js';
import type { AuthenticatedRequest } from '../../types/index.js';

/**
 * Get tasks by project
 */
export async function getTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const { status, priority, assigneeId, sprintId, parentId, type } = req.query;

    const result = await taskService.getTasksByProject(projectId, {
      status: status as string,
      priority: priority as string,
      assigneeId: assigneeId as string,
      sprintId: sprintId as string,
      parentId: parentId as string,
      type: type as string,
    });

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch tasks', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getTasks', { error });
    sendError(res, 'Failed to fetch tasks', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get task by ID
 */
export async function getTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;

    const result = await taskService.getTaskById(taskId);

    if (!result.success) {
      return sendError(res, result.error || 'Task not found', result.statusCode || HTTP_STATUS.NOT_FOUND);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getTask', { error });
    sendError(res, 'Failed to fetch task', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Create new task
 */
export async function createTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
    }

    const { projectId } = req.params;

    const result = await taskService.createTask(projectId, req.user.id, req.body);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to create task', HTTP_STATUS.BAD_REQUEST);
    }

    sendCreated(res, result.data, 'Task created successfully');
  } catch (error) {
    logger.error('Error in createTask', { error });
    sendError(res, 'Failed to create task', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Update task
 */
export async function updateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;

    const result = await taskService.updateTask(taskId, req.body, req.user?.id);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to update task', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, result.data, 'Task updated successfully');
  } catch (error) {
    logger.error('Error in updateTask', { error });
    sendError(res, 'Failed to update task', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Delete task (soft delete)
 */
export async function deleteTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;

    const result = await taskService.deleteTask(taskId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete task', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, null, 'Task moved to trash');
  } catch (error) {
    logger.error('Error in deleteTask', { error });
    sendError(res, 'Failed to delete task', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Restore deleted task
 */
export async function restoreTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;

    const result = await taskService.restoreTask(taskId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to restore task', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, result.data, 'Task restored successfully');
  } catch (error) {
    logger.error('Error in restoreTask', { error });
    sendError(res, 'Failed to restore task', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Permanently delete task
 */
export async function permanentlyDeleteTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;

    const result = await taskService.permanentlyDeleteTask(taskId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete task', HTTP_STATUS.BAD_REQUEST);
    }

    sendNoContent(res);
  } catch (error) {
    logger.error('Error in permanentlyDeleteTask', { error });
    sendError(res, 'Failed to delete task', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Move task (update status/position)
 */
export async function moveTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;
    const { status, position_index } = req.body;

    const result = await taskService.moveTask(taskId, status, position_index);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to move task', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, result.data, 'Task moved successfully');
  } catch (error) {
    logger.error('Error in moveTask', { error });
    sendError(res, 'Failed to move task', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Add comment to task
 */
export async function addComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
    }

    const { taskId } = req.params;
    const { content, parent_id } = req.body;

    const result = await taskService.addComment(taskId, req.user.id, content, parent_id);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to add comment', HTTP_STATUS.BAD_REQUEST);
    }

    sendCreated(res, result.data, 'Comment added successfully');
  } catch (error) {
    logger.error('Error in addComment', { error });
    sendError(res, 'Failed to add comment', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Update comment
 */
export async function updateComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const result = await taskService.updateComment(commentId, content);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to update comment', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, result.data, 'Comment updated successfully');
  } catch (error) {
    logger.error('Error in updateComment', { error });
    sendError(res, 'Failed to update comment', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Delete comment
 */
export async function deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { commentId } = req.params;

    const result = await taskService.deleteComment(commentId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete comment', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, null, 'Comment deleted successfully');
  } catch (error) {
    logger.error('Error in deleteComment', { error });
    sendError(res, 'Failed to delete comment', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get deleted tasks (trash)
 */
export async function getTrash(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;

    const result = await taskService.getDeletedTasks(projectId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch deleted tasks', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getTrash', { error });
    sendError(res, 'Failed to fetch deleted tasks', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export default {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  restoreTask,
  permanentlyDeleteTask,
  moveTask,
  addComment,
  updateComment,
  deleteComment,
  getTrash,
};
