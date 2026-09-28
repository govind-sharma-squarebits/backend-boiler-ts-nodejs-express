import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { sendError } from '../../../shared/utils/response';
import {
  deleteImage,
  getPresignedDownloadUrl,
  getPresignedUploadUrl,
  uploadImage,
} from '../controller/uploadController';
import upload from '../service/uploadService';

const router = Router();

router.post(
  '/',
  authenticate,
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          sendError(
            res,
            400,
            'File size is too large (maximum allowed is 5MB)',
            `Multer LIMIT_FILE_SIZE: ${err.message}`
          );
          return;
        }
        sendError(res, 400, 'Upload failed', `Multer error: ${err.message}`);
        return;
      }

      if (err instanceof Error) {
        // If it is our fileFilter validation error, return 400
        if (err.message.includes('Invalid file type') || err.message.includes('Only JPEG, PNG')) {
          sendError(res, 400, err.message, err.message);
          return;
        }

        // Internal server / AWS S3 error — log server-side and mask from client
        console.error('[Upload Error - Internal/S3]', err);
        sendError(
          res,
          500,
          'Failed to process file upload. Please try again later.',
          err.message
        );
        return;
      }

      next();
    });
  },
  uploadImage
);

router.delete('/', authenticate, deleteImage);

router.post('/presign-upload', authenticate, getPresignedUploadUrl);
router.get('/presign-download', authenticate, getPresignedDownloadUrl);

export default router;
