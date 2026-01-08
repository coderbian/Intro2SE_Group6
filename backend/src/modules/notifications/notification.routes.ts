import { Router } from 'express';
import * as notificationController from './notification.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { asyncHandler } from '../../utils/helpers.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Get notifications for current user
router.get('/', asyncHandler(notificationController.getNotifications));

// Get unread count
router.get('/unread-count', asyncHandler(notificationController.getUnreadCount));

// Mark all as read
router.post('/read-all', asyncHandler(notificationController.markAllAsRead));

// Delete all read notifications
router.delete('/read', asyncHandler(notificationController.deleteReadNotifications));

// Mark single notification as read
router.patch('/:notificationId/read', asyncHandler(notificationController.markAsRead));

// Delete single notification
router.delete('/:notificationId', asyncHandler(notificationController.deleteNotification));

export default router;
