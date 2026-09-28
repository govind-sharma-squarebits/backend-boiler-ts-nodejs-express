import { Response } from 'express';
import { AuthRequest } from '../../auth/types/auth.types';
import { sendError, sendSuccess } from '../../../shared/utils/response';
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_IMAGE_TYPES,
  deleteS3File,
  generatePresignedDownloadUrl,
  generatePresignedUploadUrl,
  resolveFileUrl,
} from '../service/uploadService';
import path from 'path';

export const uploadImage = (req: AuthRequest, res: Response): void => {
  if (!req.file) {
    sendError(res, 400, 'No file uploaded', 'req.file is missing after multer processing');
    return;
  }

  const file = req.file as Express.MulterS3.File;
  const fileUrl = resolveFileUrl(file.key, file.location);

  sendSuccess(res, 'Image uploaded successfully', {
    url: fileUrl,
    key: file.key,
    size: file.size,
    mimetype: file.mimetype,
    originalName: file.originalname,
  });
};

export const deleteImage = async (req: AuthRequest, res: Response): Promise<void> => {
  const rawKey = (req.body?.key as string) || (req.query?.key as string);

  if (!rawKey || typeof rawKey !== 'string') {
    sendError(res, 400, 'File key is required', 'Missing "key" in request body or query parameter');
    return;
  }

  const key = rawKey.trim();

  // Safety constraint: Prevent path traversal or deleting files outside uploads/
  if (!key.startsWith('uploads/') || key.includes('..')) {
    sendError(
      res,
      400,
      'Invalid key: Only keys starting with "uploads/" are allowed',
      `Key "${key}" failed validation: must start with "uploads/" and cannot contain path traversal ".." elements`
    );
    return;
  }

  try {
    await deleteS3File(key);
    sendSuccess(res, 'File deleted successfully', { key });
  } catch (err) {
    console.error('[S3 Delete Error]', err);
    const developerMessage = err instanceof Error ? err.message : 'Unknown S3 delete error';
    sendError(res, 500, 'Failed to delete file from storage', developerMessage);
  }
};

export const getPresignedUploadUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  const { fileName, mimeType } = req.body;

  if (!fileName || !mimeType) {
    sendError(res, 400, 'fileName and mimeType are required');
    return;
  }

  const ext = path.extname(fileName).toLowerCase();

  if (!ALLOWED_IMAGE_TYPES.has(mimeType) || !ALLOWED_EXTENSIONS.has(ext)) {
    sendError(res, 400, 'Invalid file type: Only JPEG, PNG, WebP, and GIF images are allowed');
    return;
  }

  try {
    const userId = req.user?.sub;
    const { uploadUrl, key, fileUrl } = await generatePresignedUploadUrl(
      fileName,
      mimeType,
      userId
    );

    sendSuccess(res, 'Presigned upload URL generated successfully', {
      uploadUrl,
      key,
      fileUrl,
    });
  } catch (err) {
    console.error('[S3 Presign Upload Error]', err);
    sendError(res, 500, 'Failed to generate upload URL');
  }
};

export const getPresignedDownloadUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  const key = req.query.key as string;

  if (!key || typeof key !== 'string') {
    sendError(res, 400, 'File key is required as a query parameter');
    return;
  }

  // Basic sanity check to prevent arbitrary bucket traversal
  if (!key.startsWith('uploads/') || key.includes('..')) {
    sendError(res, 400, 'Invalid key structure');
    return;
  }

  try {
    const downloadUrl = await generatePresignedDownloadUrl(key);
    sendSuccess(res, 'Presigned download URL generated successfully', { downloadUrl });
  } catch (err) {
    console.error('[S3 Presign Download Error]', err);
    sendError(res, 500, 'Failed to generate download URL');
  }
};
