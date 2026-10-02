import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';

const s3 = new S3Client({
  region: env.awsRegion,
  endpoint: env.s3Endpoint || undefined,
  forcePathStyle: Boolean(env.s3Endpoint),
  credentials: env.awsAccessKeyId && env.awsSecretAccessKey
    ? { accessKeyId: env.awsAccessKeyId, secretAccessKey: env.awsSecretAccessKey }
    : undefined
});

export async function createUploadUrl(key: string, contentType: string) {
  if (!env.s3Bucket) throw new Error('S3_BUCKET is not configured');
  const command = new PutObjectCommand({ Bucket: env.s3Bucket, Key: key, ContentType: contentType });
  return getSignedUrl(s3, command, { expiresIn: env.s3PresignTtlSeconds });
}
