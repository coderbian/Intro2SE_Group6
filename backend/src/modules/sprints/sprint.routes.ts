import { Router } from 'express';
import * as sprintController from './sprint.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { isProjectMember, isProjectManager } from '../../middlewares/projectAccess.js';
import { asyncHandler } from '../../utils/helpers.js';
import { validate } from '../../validators/index.js';
import { createSprintSchema, updateSprintSchema, endSprintSchema } from '../../validators/schemas.js';
import { z } from 'zod';

const router = Router();

// Sprint routes (project context)
router.get('/projects/:projectId/sprints', authenticate, isProjectMember, asyncHandler(sprintController.getSprints));
router.get('/projects/:projectId/sprints/current', authenticate, isProjectMember, asyncHandler(sprintController.getCurrentSprint));
router.post('/projects/:projectId/sprints', authenticate, isProjectManager, validate(createSprintSchema), asyncHandler(sprintController.createSprint));

// Individual sprint routes
router.get('/sprints/:sprintId', authenticate, asyncHandler(sprintController.getSprint));
router.patch('/sprints/:sprintId', authenticate, validate(updateSprintSchema), asyncHandler(sprintController.updateSprint));
router.delete('/sprints/:sprintId', authenticate, asyncHandler(sprintController.deleteSprint));
router.post('/sprints/:sprintId/end', authenticate, validate(endSprintSchema), asyncHandler(sprintController.endSprint));
router.get('/sprints/:sprintId/stats', authenticate, asyncHandler(sprintController.getStats));

// Sprint task management
router.post(
  '/sprints/:sprintId/tasks',
  authenticate,
  validate(z.object({ task_ids: z.array(z.string().uuid()) })),
  asyncHandler(sprintController.addTasks)
);
router.delete(
  '/sprints/:sprintId/tasks',
  authenticate,
  validate(z.object({ task_ids: z.array(z.string().uuid()) })),
  asyncHandler(sprintController.removeTasks)
);

export default router;
