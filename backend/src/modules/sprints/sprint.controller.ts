import { Response } from 'express';
import * as sprintService from './sprint.service.js';
import { sendSuccess, sendCreated, sendError, sendNoContent } from '../../utils/response.js';
import { HTTP_STATUS } from '../../config/constants.js';
import logger from '../../utils/logger.js';
import type { AuthenticatedRequest } from '../../types/index.js';

/**
 * Get sprints by project
 */
export async function getSprints(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const { status } = req.query;

    const result = await sprintService.getSprintsByProject(
      projectId,
      status as 'active' | 'completed' | undefined
    );

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch sprints', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getSprints', { error });
    sendError(res, 'Failed to fetch sprints', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get sprint by ID
 */
export async function getSprint(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { sprintId } = req.params;

    const result = await sprintService.getSprintById(sprintId);

    if (!result.success) {
      return sendError(res, result.error || 'Sprint not found', result.statusCode || HTTP_STATUS.NOT_FOUND);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getSprint', { error });
    sendError(res, 'Failed to fetch sprint', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get current active sprint
 */
export async function getCurrentSprint(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;

    const result = await sprintService.getCurrentSprint(projectId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch current sprint', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getCurrentSprint', { error });
    sendError(res, 'Failed to fetch current sprint', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Create new sprint
 */
export async function createSprint(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;

    const result = await sprintService.createSprint(projectId, req.body);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to create sprint', result.statusCode || HTTP_STATUS.BAD_REQUEST);
    }

    sendCreated(res, result.data, 'Sprint created successfully');
  } catch (error) {
    logger.error('Error in createSprint', { error });
    sendError(res, 'Failed to create sprint', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Update sprint
 */
export async function updateSprint(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { sprintId } = req.params;

    const result = await sprintService.updateSprint(sprintId, req.body);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to update sprint', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, result.data, 'Sprint updated successfully');
  } catch (error) {
    logger.error('Error in updateSprint', { error });
    sendError(res, 'Failed to update sprint', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * End sprint
 */
export async function endSprint(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { sprintId } = req.params;
    const { move_incomplete_to_backlog } = req.body;

    const result = await sprintService.endSprint(sprintId, move_incomplete_to_backlog ?? true);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to end sprint', result.statusCode || HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, result.data, 'Sprint ended successfully');
  } catch (error) {
    logger.error('Error in endSprint', { error });
    sendError(res, 'Failed to end sprint', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Add tasks to sprint
 */
export async function addTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { sprintId } = req.params;
    const { task_ids } = req.body;

    const result = await sprintService.addTasksToSprint(sprintId, task_ids);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to add tasks', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, null, 'Tasks added to sprint successfully');
  } catch (error) {
    logger.error('Error in addTasks', { error });
    sendError(res, 'Failed to add tasks to sprint', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Remove tasks from sprint
 */
export async function removeTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { sprintId } = req.params;
    const { task_ids } = req.body;

    const result = await sprintService.removeTasksFromSprint(sprintId, task_ids);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to remove tasks', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, null, 'Tasks removed from sprint successfully');
  } catch (error) {
    logger.error('Error in removeTasks', { error });
    sendError(res, 'Failed to remove tasks from sprint', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Delete sprint
 */
export async function deleteSprint(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { sprintId } = req.params;

    const result = await sprintService.deleteSprint(sprintId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete sprint', HTTP_STATUS.BAD_REQUEST);
    }

    sendNoContent(res);
  } catch (error) {
    logger.error('Error in deleteSprint', { error });
    sendError(res, 'Failed to delete sprint', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get sprint statistics
 */
export async function getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { sprintId } = req.params;

    const result = await sprintService.getSprintStats(sprintId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch statistics', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getStats', { error });
    sendError(res, 'Failed to fetch sprint statistics', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export default {
  getSprints,
  getSprint,
  getCurrentSprint,
  createSprint,
  updateSprint,
  endSprint,
  addTasks,
  removeTasks,
  deleteSprint,
  getStats,
};
