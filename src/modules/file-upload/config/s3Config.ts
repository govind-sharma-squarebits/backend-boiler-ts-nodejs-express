import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { env, isS3Configured } from '../../../config/env';

if (!isS3Configured()) {
  throw new Error(
    'S3 client requested but AWS configuration is missing (AWS_REGION and AWS_S3_BUCKET_NAME are required)'
  );
}

const s3Config: S3ClientConfig = {
  region: env.AWS_REGION!,
};

// If explicit static credentials are provided, use them;
// otherwise, omit credentials to allow the AWS SDK v3 default credential provider chain
// (IAM Roles for ECS, EKS IRSA, EC2 instance profile, or Web Identity) to resolve automatically.
if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    ...(env.AWS_SESSION_TOKEN ? { sessionToken: env.AWS_SESSION_TOKEN } : {}),
  };
}

// Support MinIO, LocalStack, or other S3-compatible endpoints
if (env.AWS_S3_ENDPOINT) {
  s3Config.endpoint = env.AWS_S3_ENDPOINT;
}

if (env.AWS_S3_FORCE_PATH_STYLE !== undefined) {
  s3Config.forcePathStyle = env.AWS_S3_FORCE_PATH_STYLE;
}

const s3Client = new S3Client(s3Config);

export default s3Client;
