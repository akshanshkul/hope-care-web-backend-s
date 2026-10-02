import 'dotenv/config';

const requiredSecret = (name: string): string => {
  const value = process.env[name];
  if (process.env.NODE_ENV === 'production' && !value) {
    throw new Error(`${name} must be configured in production`);
  }
  return value || `development-only-${name.toLowerCase()}`;
};

export const env = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: requiredSecret('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: requiredSecret('JWT_REFRESH_SECRET'),
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '30d'
  ,awsRegion: process.env.AWS_REGION || 'ap-south-1'
  ,awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID
  ,awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  ,s3Bucket: process.env.S3_BUCKET
  ,s3Endpoint: process.env.S3_ENDPOINT
  ,s3PresignTtlSeconds: Number(process.env.S3_PRESIGN_TTL_SECONDS || 300)
  ,zeptoMailApiUrl: process.env.ZEPTOMAIL_API_URL || 'https://api.zeptomail.in/v1.1/email'
  ,zeptoMailToken: process.env.ZEPTOMAIL_API_TOKEN
  ,zeptoMailFrom: process.env.ZEPTOMAIL_FROM_EMAIL
  ,zeptoMailFromName: process.env.ZEPTOMAIL_FROM_NAME || 'Hope-Care'
};
