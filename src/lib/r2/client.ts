import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface R2Config {
  accountId: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  isConfigured: boolean;
}

export function getR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID?.trim() || "";
  const customEndpoint = process.env.S3_ENDPOINT?.trim() || "";
  const region = process.env.S3_REGION?.trim() || "auto";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() || "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() || "";
  const bucketName = process.env.R2_BUCKET_NAME?.trim() || "";

  const endpoint =
    customEndpoint ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");

  return {
    accountId,
    endpoint,
    region,
    accessKeyId,
    secretAccessKey,
    bucketName,
    isConfigured: Boolean(
      endpoint && accessKeyId && secretAccessKey && bucketName
    ),
  };
}

let cachedClient: S3Client | null = null;
let cachedKey = "";

export function getR2Client(): { client: S3Client; bucketName: string } | null {
  const cfg = getR2Config();
  if (!cfg.isConfigured) return null;

  const key = `${cfg.endpoint}:${cfg.region}:${cfg.accessKeyId}:${cfg.bucketName}`;
  if (!cachedClient || cachedKey !== key) {
    cachedClient = new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
      // Disable automatic checksum query params so browser PUT uploads match cleanly
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
    cachedKey = key;
  }

  return { client: cachedClient, bucketName: cfg.bucketName };
}

export async function createR2PresignedUploadUrl(params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<string | null> {
  const r2 = getR2Client();
  if (!r2) return null;

  const command = new PutObjectCommand({
    Bucket: r2.bucketName,
    Key: params.key,
    ContentType: params.contentType,
  });

  return getSignedUrl(r2.client, command, {
    expiresIn: params.expiresInSeconds ?? 1800,
  });
}

export async function createR2PresignedReadUrl(params: {
  key: string;
  expiresInSeconds?: number;
}): Promise<string | null> {
  const r2 = getR2Client();
  if (!r2) return null;

  const command = new GetObjectCommand({
    Bucket: r2.bucketName,
    Key: params.key,
  });

  return getSignedUrl(r2.client, command, {
    expiresIn: params.expiresInSeconds ?? 180,
  });
}

export async function getR2ObjectText(key: string): Promise<string | null> {
  const r2 = getR2Client();
  if (!r2) return null;

  const response = await r2.client.send(
    new GetObjectCommand({
      Bucket: r2.bucketName,
      Key: key,
    })
  );

  if (!response.Body) return null;
  return response.Body.transformToString("utf-8");
}

export async function deleteR2Object(key: string): Promise<void> {
  const r2 = getR2Client();
  if (!r2 || !key) return;

  await r2.client.send(
    new DeleteObjectCommand({
      Bucket: r2.bucketName,
      Key: key,
    })
  );
}

export async function deleteR2Prefix(prefix: string): Promise<void> {
  const r2 = getR2Client();
  if (!r2 || !prefix) return;

  let continuationToken: string | undefined;

  do {
    const listed = await r2.client.send(
      new ListObjectsV2Command({
        Bucket: r2.bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    const objects = (listed.Contents || [])
      .map((obj) => obj.Key)
      .filter((k): k is string => Boolean(k))
      .map((Key) => ({ Key }));

    if (objects.length > 0) {
      await r2.client.send(
        new DeleteObjectsCommand({
          Bucket: r2.bucketName,
          Delete: { Objects: objects, Quiet: true },
        })
      );
    }

    continuationToken = listed.IsTruncated
      ? listed.NextContinuationToken
      : undefined;
  } while (continuationToken);
}
