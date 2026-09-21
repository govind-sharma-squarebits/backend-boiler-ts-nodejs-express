import { Express } from 'express';
import rateLimit from 'express-rate-limit';
import { isS3Configured } from '../config/env';
import { authRoutes } from '../modules/auth';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Too many requests. Please try again later',
  },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many upload requests. Please try again later',
  },
});

export function registerRoutes(app: Express): void {
  app.use('/api/auth', authLimiter, authRoutes);

  if (isS3Configured()) {
    // Lazy-load so AWS SDK/multer-s3 only initialize when S3 env is present
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { uploadRoutes } = require('../modules/file-upload') as typeof import('../modules/file-upload');
    app.use('/api/upload', uploadLimiter, uploadRoutes);
  } else {
    console.warn('[config] AWS S3 not configured — /api/upload disabled');
  }
}
