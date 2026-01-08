import { Router } from 'express';
import multer from 'multer';
import * as attachmentController from './attachment.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { uploadLimiter } from '../../middlewares/rateLimiter.js';
import { asyncHandler } from '../../utils/helpers.js';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'application/zip',
      'application/json',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Task attachment routes
router.get('/tasks/:taskId/attachments', authenticate, asyncHandler(attachmentController.getAttachments));
router.post(
  '/tasks/:taskId/attachments',
  authenticate,
  uploadLimiter,
  upload.single('file'),
  asyncHandler(attachmentController.uploadAttachment)
);
router.get('/tasks/:taskId/attachments/storage', authenticate, asyncHandler(attachmentController.getStorageUsage));

// Individual attachment routes
router.get('/attachments/:attachmentId', authenticate, asyncHandler(attachmentController.getAttachment));
router.get('/attachments/:attachmentId/download', authenticate, asyncHandler(attachmentController.getDownloadUrl));
router.delete('/attachments/:attachmentId', authenticate, asyncHandler(attachmentController.deleteAttachment));

export default router;
