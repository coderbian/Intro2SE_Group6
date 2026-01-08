import { Router } from 'express';
import * as authController from './auth.controller.js';
import { authenticate, optionalAuth } from '../../middlewares/auth.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';
import { asyncHandler } from '../../utils/helpers.js';
import { validate } from '../../validators/index.js';
import { 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema,
  updatePasswordSchema,
  refreshTokenSchema 
} from '../../validators/schemas.js';

const router = Router();

// Apply rate limiting to auth routes
router.use(authLimiter);

// Public routes
router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(authController.refreshTokens));
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(authController.requestPasswordReset));
router.post('/verify-email', asyncHandler(authController.verifyEmail));
router.post('/resend-verification', asyncHandler(authController.resendVerificationEmail));
router.get('/oauth', asyncHandler(authController.getOAuthUrl));

// Protected routes
router.post('/logout', authenticate, asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.getCurrentUser));
router.post('/reset-password', authenticate, validate(resetPasswordSchema), asyncHandler(authController.resetPassword));
router.post('/update-password', authenticate, validate(updatePasswordSchema), asyncHandler(authController.updatePassword));

export default router;
