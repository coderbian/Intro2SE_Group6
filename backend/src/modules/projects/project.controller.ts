import { Response } from 'express';
import * as projectService from './project.service.js';
import { sendSuccess, sendCreated, sendError, sendNoContent } from '../../utils/response.js';
import { HTTP_STATUS } from '../../config/constants.js';
import logger from '../../utils/logger.js';
import type { AuthenticatedRequest } from '../../types/index.js';

/**
 * Get all projects for current user
 */
export async function getProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await projectService.getUserProjects(req.user.id);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch projects', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getProjects', { error });
    sendError(res, 'Failed to fetch projects', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get project by ID
 */
export async function getProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await projectService.getProjectById(id);

    if (!result.success) {
      return sendError(res, result.error || 'Project not found', result.statusCode || HTTP_STATUS.NOT_FOUND);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getProject', { error });
    sendError(res, 'Failed to fetch project', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Create new project
 */
export async function createProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await projectService.createProject(req.user.id, req.body);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to create project', HTTP_STATUS.BAD_REQUEST);
    }

    sendCreated(res, result.data, 'Project created successfully');
  } catch (error) {
    logger.error('Error in createProject', { error });
    sendError(res, 'Failed to create project', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Update project
 */
export async function updateProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await projectService.updateProject(id, req.body);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to update project', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, result.data, 'Project updated successfully');
  } catch (error) {
    logger.error('Error in updateProject', { error });
    sendError(res, 'Failed to update project', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Delete project (soft delete)
 */
export async function deleteProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await projectService.deleteProject(id);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete project', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, null, 'Project moved to trash');
  } catch (error) {
    logger.error('Error in deleteProject', { error });
    sendError(res, 'Failed to delete project', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Restore deleted project
 */
export async function restoreProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await projectService.restoreProject(id);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to restore project', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, result.data, 'Project restored successfully');
  } catch (error) {
    logger.error('Error in restoreProject', { error });
    sendError(res, 'Failed to restore project', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Permanently delete project
 */
export async function permanentlyDeleteProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await projectService.permanentlyDeleteProject(id);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete project', HTTP_STATUS.BAD_REQUEST);
    }

    sendNoContent(res);
  } catch (error) {
    logger.error('Error in permanentlyDeleteProject', { error });
    sendError(res, 'Failed to delete project', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get project members
 */
export async function getMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await projectService.getProjectMembers(id);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch members', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getMembers', { error });
    sendError(res, 'Failed to fetch members', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Add member to project
 */
export async function addMember(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    // Send invitation instead of directly adding
    const result = await projectService.sendInvitation(id, email, req.user?.id || '', role);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to send invitation', result.statusCode || HTTP_STATUS.BAD_REQUEST);
    }

    sendCreated(res, result.data, 'Invitation sent successfully');
  } catch (error) {
    logger.error('Error in addMember', { error });
    sendError(res, 'Failed to add member', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Remove member from project
 */
export async function removeMember(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id, userId } = req.params;

    const result = await projectService.removeMember(id, userId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to remove member', result.statusCode || HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, null, 'Member removed successfully');
  } catch (error) {
    logger.error('Error in removeMember', { error });
    sendError(res, 'Failed to remove member', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Update member role
 */
export async function updateMemberRole(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;

    const result = await projectService.updateMemberRole(id, userId, role);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to update role', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, result.data, 'Member role updated successfully');
  } catch (error) {
    logger.error('Error in updateMemberRole', { error });
    sendError(res, 'Failed to update member role', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get project invitations
 */
export async function getInvitations(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await projectService.getProjectInvitations(id);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch invitations', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getInvitations', { error });
    sendError(res, 'Failed to fetch invitations', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get user's pending invitations
 */
export async function getMyInvitations(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await projectService.getUserInvitations(req.user.id, req.user.email);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch invitations', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getMyInvitations', { error });
    sendError(res, 'Failed to fetch invitations', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Respond to invitation
 */
export async function respondToInvitation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
    }

    const { invitationId } = req.params;
    const { action } = req.body;

    const result = await projectService.respondToInvitation(
      invitationId,
      req.user.id,
      action === 'accept'
    );

    if (!result.success) {
      return sendError(res, result.error || 'Failed to respond to invitation', result.statusCode || HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, null, action === 'accept' ? 'Invitation accepted' : 'Invitation rejected');
  } catch (error) {
    logger.error('Error in respondToInvitation', { error });
    sendError(res, 'Failed to respond to invitation', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get deleted projects (trash)
 */
export async function getTrash(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await projectService.getDeletedProjects(req.user.id);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch deleted projects', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getTrash', { error });
    sendError(res, 'Failed to fetch deleted projects', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export default {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  restoreProject,
  permanentlyDeleteProject,
  getMembers,
  addMember,
  removeMember,
  updateMemberRole,
  getInvitations,
  getMyInvitations,
  respondToInvitation,
  getTrash,
};
