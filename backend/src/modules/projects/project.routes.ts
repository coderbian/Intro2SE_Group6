import { Router } from 'express';
import * as projectController from './project.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { isProjectMember, isProjectManager, isProjectOwner } from '../../middlewares/projectAccess.js';
import { asyncHandler } from '../../utils/helpers.js';
import { validate } from '../../validators/index.js';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  respondToRequestSchema,
} from '../../validators/schemas.js';

const router = Router();

// User's projects
router.get('/', authenticate, asyncHandler(projectController.getProjects));
router.post('/', authenticate, validate(createProjectSchema), asyncHandler(projectController.createProject));

// Invitations for current user
router.get('/invitations/me', authenticate, asyncHandler(projectController.getMyInvitations));
router.post('/invitations/:invitationId/respond', authenticate, validate(respondToRequestSchema), asyncHandler(projectController.respondToInvitation));

// Trash
router.get('/trash', authenticate, asyncHandler(projectController.getTrash));

// Project-specific routes
router.get('/:id', authenticate, isProjectMember, asyncHandler(projectController.getProject));
router.patch('/:id', authenticate, isProjectManager, validate(updateProjectSchema), asyncHandler(projectController.updateProject));
router.delete('/:id', authenticate, isProjectManager, asyncHandler(projectController.deleteProject));
router.post('/:id/restore', authenticate, isProjectOwner, asyncHandler(projectController.restoreProject));
router.delete('/:id/permanent', authenticate, isProjectOwner, asyncHandler(projectController.permanentlyDeleteProject));

// Members
router.get('/:id/members', authenticate, isProjectMember, asyncHandler(projectController.getMembers));
router.post('/:id/members', authenticate, isProjectManager, validate(addMemberSchema), asyncHandler(projectController.addMember));
router.delete('/:id/members/:userId', authenticate, isProjectManager, asyncHandler(projectController.removeMember));
router.patch('/:id/members/:userId', authenticate, isProjectManager, validate(updateMemberRoleSchema), asyncHandler(projectController.updateMemberRole));

// Invitations for a project
router.get('/:id/invitations', authenticate, isProjectManager, asyncHandler(projectController.getInvitations));

export default router;
