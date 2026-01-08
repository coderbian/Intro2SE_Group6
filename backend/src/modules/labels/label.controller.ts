import { Response } from 'express';
import * as labelService from './label.service.js';
import { sendSuccess, sendCreated, sendError, sendNoContent } from '../../utils/response.js';
import { HTTP_STATUS } from '../../config/constants.js';
import logger from '../../utils/logger.js';
import type { AuthenticatedRequest } from '../../types/index.js';

/**
 * Get labels by project
 */
export async function getLabels(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;

    const result = await labelService.getLabelsByProject(projectId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch labels', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getLabels', { error });
    sendError(res, 'Failed to fetch labels', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get label by ID
 */
export async function getLabel(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { labelId } = req.params;

    const result = await labelService.getLabelById(labelId);

    if (!result.success) {
      return sendError(res, result.error || 'Label not found', result.statusCode || HTTP_STATUS.NOT_FOUND);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getLabel', { error });
    sendError(res, 'Failed to fetch label', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Create label
 */
export async function createLabel(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;

    const result = await labelService.createLabel({
      ...req.body,
      project_id: projectId,
    });

    if (!result.success) {
      return sendError(res, result.error || 'Failed to create label', result.statusCode || HTTP_STATUS.BAD_REQUEST);
    }

    sendCreated(res, result.data, 'Label created successfully');
  } catch (error) {
    logger.error('Error in createLabel', { error });
    sendError(res, 'Failed to create label', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Update label
 */
export async function updateLabel(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { labelId } = req.params;

    const result = await labelService.updateLabel(labelId, req.body);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to update label', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, result.data, 'Label updated successfully');
  } catch (error) {
    logger.error('Error in updateLabel', { error });
    sendError(res, 'Failed to update label', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Delete label
 */
export async function deleteLabel(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { labelId } = req.params;

    const result = await labelService.deleteLabel(labelId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete label', HTTP_STATUS.BAD_REQUEST);
    }

    sendNoContent(res);
  } catch (error) {
    logger.error('Error in deleteLabel', { error });
    sendError(res, 'Failed to delete label', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get tasks by label
 */
export async function getTasksByLabel(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { labelId } = req.params;

    const result = await labelService.getTasksByLabel(labelId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch tasks', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getTasksByLabel', { error });
    sendError(res, 'Failed to fetch tasks', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export default {
  getLabels,
  getLabel,
  createLabel,
  updateLabel,
  deleteLabel,
  getTasksByLabel,
};
