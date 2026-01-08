import { Router } from 'express';
import * as userController from './user.controller.js';
import { authenticate, requireAdmin } from '../../middlewares/auth.js';
import { asyncHandler } from '../../utils/helpers.js';
import { validate } from '../../validators/index.js';
import { userUpdateSchema, updatePreferencesSchema } from '../../validators/schemas.js';
import { z } from 'zod';

const router = Router();

// Current user routes
router.get('/me', authenticate, asyncHandler(userController.getMe));
router.patch('/me', authenticate, validate(userUpdateSchema), asyncHandler(userController.updateMe));

// User preferences
router.get('/preferences', authenticate, asyncHandler(userController.getPreferences));
router.patch('/preferences', authenticate, validate(updatePreferencesSchema), asyncHandler(userController.updatePreferences));

// Admin routes
router.get('/', authenticate, requireAdmin, asyncHandler(userController.getAllUsers));
router.get('/:id', authenticate, requireAdmin, asyncHandler(userController.getUserById));
router.patch('/:id/role', authenticate, requireAdmin, validate(z.object({ role: z.enum(['user', 'admin']) })), asyncHandler(userController.updateUserRole));
router.patch('/:id/status', authenticate, requireAdmin, validate(z.object({ status: z.enum(['active', 'inactive']) })), asyncHandler(userController.updateUserStatus));
router.delete('/:id', authenticate, requireAdmin, asyncHandler(userController.deleteUser));

export default router;
