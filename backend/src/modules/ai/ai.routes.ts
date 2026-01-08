import { Router } from 'express';
import * as aiController from './ai.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { aiLimiter } from '../../middlewares/rateLimiter.js';
import { asyncHandler } from '../../utils/helpers.js';
import { validate } from '../../validators/index.js';
import { 
  enhanceDescriptionSchema, 
  estimateTimeSchema, 
  chatSchema,
  suggestTasksSchema,
  summarizeProgressSchema 
} from '../../validators/schemas.js';

const router = Router();

// All AI routes require authentication and rate limiting
router.use(authenticate);
router.use(aiLimiter);

// AI endpoints
router.post('/enhance-description', validate(enhanceDescriptionSchema), asyncHandler(aiController.enhanceDescription));
router.post('/estimate-time', validate(estimateTimeSchema), asyncHandler(aiController.estimateTime));
router.post('/chat', validate(chatSchema), asyncHandler(aiController.chat));
router.post('/suggest-tasks', validate(suggestTasksSchema), asyncHandler(aiController.suggestTasks));
router.post('/summarize-progress', validate(summarizeProgressSchema), asyncHandler(aiController.summarizeProgress));
router.get('/history', asyncHandler(aiController.getHistory));

export default router;
