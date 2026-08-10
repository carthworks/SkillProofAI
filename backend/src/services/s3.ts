import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Region = process.env.S3_REGION ?? 'us-east-1';
const s3Bucket = process.env.S3_BUCKET_NAME ?? 'talentforge-submissions';

// Configure S3 client mapping to MinIO local development endpoint or S3 Production
export const s3 = new S3Client({
  region: s3Region,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? 'minioadmin',
  },
  // If S3_ENDPOINT is specified (like local MinIO), use it, otherwise default to AWS S3.
  endpoint: process.env.S3_ENDPOINT ?? 'http://127.0.0.1:9000',
  forcePathStyle: true, // Required for MinIO compatibility
});

/**
 * Generate a presigned URL to PUT (upload) an object into S3
 * @param key The destination path/filename in S3
 * @param contentType The MIME content type of the file
 * @param expiresIn Time in seconds until the URL expires (default 15 mins)
 */
export async function getUploadUrl(key: string, contentType: string, expiresIn = 900): Promise<string> {
  // SHIM: Bypass S3/MinIO and return a local API endpoint for POC
  return `/api/students/profile/local-upload?key=${encodeURIComponent(key)}`;
}

/**
 * Generate a presigned URL to GET (download) an object from S3
 * @param key The path/filename in S3
 * @param expiresIn Time in seconds until the URL expires (default 1 hour)
 */
export async function getDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: s3Bucket,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Upload a raw Buffer directly to S3 / MinIO
 */
export async function uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: s3Bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3.send(command);
  const endpoint = process.env.S3_ENDPOINT ?? 'http://127.0.0.1:9000';
  return `${endpoint}/${s3Bucket}/${key}`;
}

/**
 * Download a file from S3 and return its contents as a Buffer
 */
export async function getObjectBuffer(key: string): Promise<Buffer> {
  // SHIM: Read from local uploads folder instead of S3
  const fs = require('fs');
  const path = require('path');
  const localPath = path.join(process.cwd(), 'uploads', key);
  
  if (fs.existsSync(localPath)) {
    return fs.readFileSync(localPath);
  }
  
  throw new Error(`File not found locally: ${localPath}`);
}
