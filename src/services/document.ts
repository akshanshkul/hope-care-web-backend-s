import crypto from 'node:crypto';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PoolClient } from 'pg';
import { env } from '../config/env';
import { pool, query } from '../db/client';

const allowed: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'application/pdf': ['.pdf'],
  'image/webp': ['.webp']
};
const maxSize = 10 * 1024 * 1024;
let schemaWarningLogged = false;
const s3 = new S3Client({ region: env.awsRegion, endpoint: env.s3Endpoint || undefined, forcePathStyle: Boolean(env.s3Endpoint), credentials: env.awsAccessKeyId && env.awsSecretAccessKey ? { accessKeyId: env.awsAccessKeyId, secretAccessKey: env.awsSecretAccessKey } : undefined });

export function validateFile(file: Express.Multer.File) {
  const extensions = allowed[file.mimetype];
  const extension = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
  if (!extensions || !extensions.includes(extension) || file.size <= 0 || file.size > maxSize) throw new Error('Unsupported or oversized file');
  if ((file.mimetype === 'application/pdf' && file.buffer.subarray(0, 4).toString() !== '%PDF') ||
      (file.mimetype === 'image/png' && file.buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') ||
      (file.mimetype === 'image/jpeg' && file.buffer.subarray(0, 2).toString('hex') !== 'ffd8')) throw new Error('File content does not match its MIME type');
}

export async function uploadDocument(userId: string, type: string, file: Express.Multer.File) {
  validateFile(file);
  if (!env.s3Bucket) throw new Error('S3_BUCKET is not configured');
  const key = `private/${userId}/${crypto.randomUUID()}${file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase()}`;
  await s3.send(new PutObjectCommand({ Bucket: env.s3Bucket, Key: key, Body: file.buffer, ContentType: file.mimetype }));
  try {
    return (await query(`INSERT INTO documents(owner_user_id,document_type,file_name,mime_type,file_size,storage_key,expires_at) VALUES($1,$2,$3,$4,$5,$6,now()+interval '30 minutes') RETURNING public_id AS "documentId",file_name AS "fileName",mime_type AS "mimeType",file_size AS size,status,expires_at AS "expiresAt"`, [userId, type, file.originalname, file.mimetype, file.size, key]))[0];
  } catch (error) {
    await s3.send(new DeleteObjectCommand({ Bucket: env.s3Bucket, Key: key }));
    throw error;
  }
}

async function ownedDocument(client: PoolClient, userId: string, publicId: string, expectedType?: string) {
  const result = await client.query(`SELECT * FROM documents WHERE public_id=$1 AND owner_user_id=$2 AND deleted_at IS NULL FOR UPDATE`, [publicId, userId]);
  const document = result.rows[0];
  if (!document || document.status !== 'TEMPORARY' || (document.expires_at && new Date(document.expires_at) <= new Date())) throw new Error('Document is unavailable');
  if (expectedType && document.document_type !== expectedType) throw new Error('Document type is invalid for this operation');
  return document;
}

export async function getDocument(userId: string, publicId: string) {
  return (await query(`SELECT public_id AS "documentId",document_type AS "documentType",file_name AS "fileName",mime_type AS "mimeType",file_size AS size,status,created_at AS "createdAt" FROM documents WHERE public_id=$1 AND owner_user_id=$2 AND deleted_at IS NULL`, [publicId, userId]))[0];
}
export async function documentUrl(userId: string, publicId: string) {
  const doc = (await query(`SELECT storage_key,mime_type FROM documents WHERE public_id=$1 AND owner_user_id=$2 AND deleted_at IS NULL`, [publicId, userId]))[0];
  if (!doc || !env.s3Bucket) throw new Error('Document not found');
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: env.s3Bucket, Key: doc.storage_key }), { expiresIn: env.s3PresignTtlSeconds });
}
export async function deleteDocument(userId: string, publicId: string) {
  const doc = (await query(`UPDATE documents SET status='DELETED',deleted_at=now(),updated_at=now() WHERE public_id=$1 AND owner_user_id=$2 AND status='TEMPORARY' RETURNING storage_key`, [publicId, userId]))[0];
  if (doc && env.s3Bucket) await s3.send(new DeleteObjectCommand({ Bucket: env.s3Bucket, Key: doc.storage_key }));
  if (!doc) throw new Error('Document not found or already attached');
}
export async function attachDocument(client: PoolClient, userId: string, publicId: string, type?: string) {
  return ownedDocument(client, userId, publicId, type);
}
export async function cleanupTemporaryDocuments() {
  const client = await pool.connect();
  try {
    const schema = await client.query<{ exists: boolean }>(`SELECT to_regclass('public.documents') IS NOT NULL AS exists`);
    if (!schema.rows[0]?.exists) {
      if (!schemaWarningLogged) {
        console.error('Temporary document cleanup skipped: documents table is missing. Run npm run db:migrate.');
        schemaWarningLogged = true;
      }
      return;
    }
    await client.query('BEGIN');
    const docs = (await client.query(`SELECT id,storage_key FROM documents WHERE is_temporary AND expires_at<=now() AND deleted_at IS NULL FOR UPDATE SKIP LOCKED`)).rows;
    for (const doc of docs) {
      if (env.s3Bucket) await s3.send(new DeleteObjectCommand({ Bucket: env.s3Bucket, Key: doc.storage_key }));
      await client.query(`UPDATE documents SET status='DELETED',deleted_at=now(),updated_at=now() WHERE id=$1`, [doc.id]);
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
