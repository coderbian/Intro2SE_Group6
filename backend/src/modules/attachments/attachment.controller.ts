import { Response } from 'express';
import * as attachmentService from './attachment.service.js';
import { sendSuccess, sendCreated, sendError, sendNoContent } from '../../utils/response.js';
import { HTTP_STATUS } from '../../config/constants.js';
import logger from '../../utils/logger.js';
import type { AuthenticatedRequest } from '../../types/index.js';

/**
 * Get attachments by task
 */
export async function getAttachments(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;

    const result = await attachmentService.getAttachmentsByTask(taskId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch attachments', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getAttachments', { error });
    sendError(res, 'Failed to fetch attachments', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get attachment by ID
 */
export async function getAttachment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { attachmentId } = req.params;

    const result = await attachmentService.getAttachmentById(attachmentId);

    if (!result.success) {
      return sendError(res, result.error || 'Attachment not found', result.statusCode || HTTP_STATUS.NOT_FOUND);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getAttachment', { error });
    sendError(res, 'Failed to fetch attachment', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Upload attachment
 */
export async function uploadAttachment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      return sendError(res, 'No file uploaded', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await attachmentService.uploadAttachment(taskId, userId, {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    if (!result.success) {
      return sendError(res, result.error || 'Failed to upload attachment', HTTP_STATUS.BAD_REQUEST);
    }

    sendCreated(res, result.data, 'Attachment uploaded successfully');
  } catch (error) {
    logger.error('Error in uploadAttachment', { error });
    sendError(res, 'Failed to upload attachment', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Delete attachment
 */
export async function deleteAttachment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { attachmentId } = req.params;
    const userId = req.user!.id;

    const result = await attachmentService.deleteAttachment(attachmentId, userId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete attachment', result.statusCode || HTTP_STATUS.BAD_REQUEST);
    }

    sendNoContent(res);
  } catch (error) {
    logger.error('Error in deleteAttachment', { error });
    sendError(res, 'Failed to delete attachment', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get download URL
 */
export async function getDownloadUrl(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { attachmentId } = req.params;

    const result = await attachmentService.getDownloadUrl(attachmentId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to get download URL', result.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getDownloadUrl', { error });
    sendError(res, 'Failed to get download URL', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get task storage usage
 */
export async function getStorageUsage(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;

    const result = await attachmentService.getTaskStorageUsage(taskId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to get storage usage', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, { bytes: result.data, formatted: formatBytes(result.data!) });
  } catch (error) {
    logger.error('Error in getStorageUsage', { error });
    sendError(res, 'Failed to get storage usage', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default {
  getAttachments,
  getAttachment,
  uploadAttachment,
  deleteAttachment,
  getDownloadUrl,
  getStorageUsage,
};
