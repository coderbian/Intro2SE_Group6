import { Response } from 'express';
import * as aiService from './ai.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { HTTP_STATUS } from '../../config/constants.js';
import logger from '../../utils/logger.js';
import type { AuthenticatedRequest } from '../../types/index.js';

/**
 * Enhance task description
 */
export async function enhanceDescription(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { title, description, context } = req.body;

    const result = await aiService.enhanceDescription(userId, title, description, context);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to enhance description', result.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, { enhanced_description: result.data });
  } catch (error) {
    logger.error('Error in enhanceDescription', { error });
    sendError(res, 'Failed to enhance description', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Estimate task time
 */
export async function estimateTime(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { title, description, complexity } = req.body;

    const result = await aiService.estimateTime(userId, title, description, complexity);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to estimate time', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in estimateTime', { error });
    sendError(res, 'Failed to estimate time', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Chat with AI assistant
 */
export async function chat(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { message, conversation_history, project_context } = req.body;

    const result = await aiService.chat(
      userId,
      message,
      conversation_history || [],
      project_context
    );

    if (!result.success) {
      return sendError(res, result.error || 'Failed to process message', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, { response: result.data });
  } catch (error) {
    logger.error('Error in chat', { error });
    sendError(res, 'Failed to process chat message', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Suggest tasks for project
 */
export async function suggestTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { project_name, project_description, existing_tasks } = req.body;

    const result = await aiService.suggestTasks(
      userId,
      project_name,
      project_description,
      existing_tasks
    );

    if (!result.success) {
      return sendError(res, result.error || 'Failed to suggest tasks', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, { suggestions: result.data });
  } catch (error) {
    logger.error('Error in suggestTasks', { error });
    sendError(res, 'Failed to suggest tasks', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Summarize project progress
 */
export async function summarizeProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { project_name, stats, recent_activity } = req.body;

    const result = await aiService.summarizeProgress(
      userId,
      project_name,
      stats,
      recent_activity
    );

    if (!result.success) {
      return sendError(res, result.error || 'Failed to summarize progress', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, { summary: result.data });
  } catch (error) {
    logger.error('Error in summarizeProgress', { error });
    sendError(res, 'Failed to summarize progress', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get AI interaction history
 */
export async function getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await aiService.getInteractionHistory(userId, limit);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch history', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getHistory', { error });
    sendError(res, 'Failed to fetch interaction history', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export default {
  enhanceDescription,
  estimateTime,
  chat,
  suggestTasks,
  summarizeProgress,
  getHistory,
};
