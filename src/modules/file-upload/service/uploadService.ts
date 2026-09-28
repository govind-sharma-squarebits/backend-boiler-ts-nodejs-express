import { randomUUID } from 'crypto';
import path from 'path';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { env } from '../../../config/env';
import { AuthRequest } from '../../auth/types/auth.types';
import s3Client from '../config/s3Config';
import { sanitizeFilename } from '../utils/sanitizeFilename';

export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

/**
 * Resolves public URL for an uploaded S3 object.
 * Prefers CloudFront CDN URL (if configured), falling back to S3 direct URL.
 */
export function resolveFileUrl(key: string, directS3Location?: string): string {
  if (env.CDN_BASE_URL) {
    const baseUrl = env.CDN_BASE_URL.replace(/\/$/, '');
    return `${baseUrl}/${key}`;
  }

  if (directS3Location) {
    return directS3Location;
  }

  return `https://${env.AWS_S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Deletes an object from S3 by key.
 */
export async function deleteS3File(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: env.AWS_S3_BUCKET_NAME!,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generate a pre-signed URL for direct client-to-S3 upload (PUT).
 */
export async function generatePresignedUploadUrl(
  fileName: string,
  fileType: string,
  uploadedBy?: string,
  expiresInSeconds = 300
): Promise<{ uploadUrl: string; key: string; fileUrl: string }> {
  const ext = path.extname(fileName).toLowerCase();
  const baseName = path.basename(fileName, ext);
  const safeName = sanitizeFilename(baseName);
  const key = `uploads/${randomUUID()}-${safeName}${ext}`;

  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET_NAME!,
    Key: key,
    ContentType: fileType,
    Metadata: uploadedBy ? { uploadedBy } : {},
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  const fileUrl = resolveFileUrl(key);

  return { uploadUrl, key, fileUrl };
}

/**
 * Generate a pre-signed URL to view/download a private object (GET).
 */
export async function generatePresignedDownloadUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET_NAME!,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: env.AWS_S3_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata(req, _file, cb) {
      const userId = (req as AuthRequest).user?.sub;
      cb(null, userId ? { uploadedBy: userId } : {});
    },
    key(_req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      const baseName = path.basename(file.originalname, ext);
      const safeName = sanitizeFilename(baseName);
      cb(null, `uploads/${randomUUID()}-${safeName}${ext}`);
    },
  }),
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();

    if (ALLOWED_IMAGE_TYPES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true);
      return;
    }

    cb(new Error('Invalid file type: Only JPEG, PNG, WebP, and GIF images are allowed'));
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export default upload;
