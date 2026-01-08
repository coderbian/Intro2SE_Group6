import { Router } from 'express';
import * as labelController from './label.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { isProjectMember, isProjectManager } from '../../middlewares/projectAccess.js';
import { asyncHandler } from '../../utils/helpers.js';
import { validate } from '../../validators/index.js';
import { createLabelSchema, updateLabelSchema } from '../../validators/schemas.js';

const router = Router();

// Label routes (project context)
router.get('/projects/:projectId/labels', authenticate, isProjectMember, asyncHandler(labelController.getLabels));
router.post('/projects/:projectId/labels', authenticate, isProjectManager, validate(createLabelSchema), asyncHandler(labelController.createLabel));

// Individual label routes
router.get('/labels/:labelId', authenticate, asyncHandler(labelController.getLabel));
router.patch('/labels/:labelId', authenticate, validate(updateLabelSchema), asyncHandler(labelController.updateLabel));
router.delete('/labels/:labelId', authenticate, asyncHandler(labelController.deleteLabel));
router.get('/labels/:labelId/tasks', authenticate, asyncHandler(labelController.getTasksByLabel));

export default router;
