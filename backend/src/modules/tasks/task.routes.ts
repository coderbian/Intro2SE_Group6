import { Router } from 'express';
import * as taskController from './task.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { isProjectMember, isProjectManager, canEditTask } from '../../middlewares/projectAccess.js';
import { asyncHandler } from '../../utils/helpers.js';
import { validate } from '../../validators/index.js';
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  createCommentSchema,
  updateCommentSchema,
} from '../../validators/schemas.js';

const router = Router();

// Task routes (project context)
router.get('/projects/:projectId/tasks', authenticate, isProjectMember, asyncHandler(taskController.getTasks));
router.get('/projects/:projectId/tasks/trash', authenticate, isProjectManager, asyncHandler(taskController.getTrash));
router.post('/projects/:projectId/tasks', authenticate, isProjectMember, validate(createTaskSchema), asyncHandler(taskController.createTask));

// Individual task routes
router.get('/tasks/:taskId', authenticate, asyncHandler(taskController.getTask));
router.patch('/tasks/:taskId', authenticate, canEditTask, validate(updateTaskSchema), asyncHandler(taskController.updateTask));
router.delete('/tasks/:taskId', authenticate, canEditTask, asyncHandler(taskController.deleteTask));
router.post('/tasks/:taskId/restore', authenticate, asyncHandler(taskController.restoreTask));
router.delete('/tasks/:taskId/permanent', authenticate, asyncHandler(taskController.permanentlyDeleteTask));
router.patch('/tasks/:taskId/move', authenticate, canEditTask, validate(moveTaskSchema), asyncHandler(taskController.moveTask));

// Comment routes
router.post('/tasks/:taskId/comments', authenticate, validate(createCommentSchema), asyncHandler(taskController.addComment));
router.patch('/comments/:commentId', authenticate, validate(updateCommentSchema), asyncHandler(taskController.updateComment));
router.delete('/comments/:commentId', authenticate, asyncHandler(taskController.deleteComment));

export default router;
