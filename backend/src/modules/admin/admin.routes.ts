import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authenticate, requireAdmin } from '../../middlewares/auth.js';
import { asyncHandler } from '../../utils/helpers.js';
import { validate } from '../../validators/index.js';
import { z } from 'zod';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// User management
router.get('/users', asyncHandler(adminController.getUsers));
router.patch(
  '/users/:userId/status',
  validate(z.object({ status: z.enum(['active', 'pending', 'suspended']) })),
  asyncHandler(adminController.updateUserStatus)
);
router.patch(
  '/users/:userId/role',
  validate(z.object({ role: z.enum(['user', 'admin']) })),
  asyncHandler(adminController.updateUserRole)
);
router.delete('/users/:userId', asyncHandler(adminController.deleteUser));

// System statistics
router.get('/stats', asyncHandler(adminController.getStats));
router.get('/activity', asyncHandler(adminController.getActivity));

// Project management
router.get('/projects', asyncHandler(adminController.getProjects));
router.delete('/projects/:projectId', asyncHandler(adminController.forceDeleteProject));

export default router;
