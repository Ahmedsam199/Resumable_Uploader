import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  ListBucketsCommand,
  CreateBucketCommand,
  ListPartsCommand,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class MinioService {
  private readonly logger = new Logger(MinioService.name);
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      endpoint: process.env.MINIO_PUBLIC_ENDPOINT,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY,
        secretAccessKey: process.env.MINIO_SECRET_KEY,
      },
    });
  }

  /**
   * Generates a unique filename to prevent overwrites
   * @param originalName - Original filename
   * @param strategy - Strategy to use for unique naming
   * @returns Unique filename
   */
  private generateUniqueFilename(
    originalName: string,
    strategy: 'uuid' | 'timestamp' | 'counter' = 'uuid',
  ): string {
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);

    switch (strategy) {
      case 'uuid':
        return `${nameWithoutExt}_${randomUUID()}${ext}`;
      case 'timestamp':
        return `${nameWithoutExt}_${Date.now()}${ext}`;
      case 'counter':
        // This would need additional logic to check existing files
        return `${nameWithoutExt}_${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`;
      default:
        return `${nameWithoutExt}_${randomUUID()}${ext}`;
    }
  }

  /**
   * Checks if an object exists in the bucket
   * @param bucket - Bucket name
   * @param objectName - Object key/name
   * @returns True if object exists, false otherwise
   */
  async objectExists(bucket: string, objectName: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: objectName,
        }),
      );
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Generates a unique object name that doesn't exist in the bucket
   * @param bucket - Bucket name
   * @param originalName - Original filename
   * @param maxAttempts - Maximum attempts to find unique name
   * @returns Unique object name
   */
  async generateUniqueObjectName(
    bucket: string,
    originalName: string,
    maxAttempts: number = 10,
  ): Promise<string> {
    let attempts = 0;
    let uniqueName = originalName;

    while (attempts < maxAttempts) {
      const exists = await this.objectExists(bucket, uniqueName);
      if (!exists) {
        return uniqueName;
      }

      uniqueName = this.generateUniqueFilename(originalName, 'uuid');
      attempts++;
    }

    // Fallback with timestamp + random number
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    return `${nameWithoutExt}_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
  }

  /**
   * Ensuring the bucket already exists in the minio if not it will be created
   * @param bucket - String provided by user
   */
  async ensureBucket(bucket: string) {
    try {
      const { Buckets } = await this.client
        .send(new ListBucketsCommand({}))
        .catch((error) => {
          this.logger.error(`Failed to list buckets: ${error.message}`);
          throw new Error('Upload failed');
        });
      const exists = Buckets?.some((b) => b.Name === bucket);
      if (!exists) {
        await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
        this.logger.log(`Bucket ${bucket} created successfully`);
      }
    } catch (error) {
      this.logger.error(`Error ensuring bucket ${bucket}:`, error);
      throw new Error('Upload failed');
    }
  }

  /**
   * Starts a multipart upload for an object in MinIO with optional unique naming.
   * @param bucket - The name of the bucket where the object will be uploaded.
   * @param objectName - The name/key of the object to upload.
   * @param preventOverwrite - Whether to generate unique name if file exists
   * @returns An object containing the uploadId, key, bucket name, and final object name
   */
  async startMultipart(
    bucket: string,
    objectName: string,
    preventOverwrite: boolean = true,
  ) {
    await this.ensureBucket(bucket);

    let finalObjectName = objectName;
    if (preventOverwrite) {
      finalObjectName = await this.generateUniqueObjectName(bucket, objectName);
    }

    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: finalObjectName,
    });
    const response = await this.client.send(command);
    return {
      uploadId: response.UploadId,
      key: response.Key,
      bucket: bucket,
      originalName: objectName,
      finalName: finalObjectName,
    };
  }

  /**
   * Uploads a single part of a multipart upload to MinIO.
   * @param bucket - The name of the bucket where the object is being uploaded.
   * @param objectName - The name/key of the object being uploaded.
   * @param uploadId - The ID of the multipart upload returned by startMultipart().
   * @param partNumber - The sequential part number (starting from 1) of this upload.
   * @param body - The data to upload for this part (Buffer, Uint8Array, or Blob).
   * @returns An object containing the ETag returned by MinIO and the part number.
   */
  async uploadPart(
    bucket: string,
    objectName: string,
    uploadId: string,
    partNumber: number,
    body: Buffer | Uint8Array | Blob,
  ) {
    const command = new UploadPartCommand({
      Bucket: bucket,
      Key: objectName,
      PartNumber: partNumber,
      UploadId: uploadId,
      Body: body,
    });
    const response = await this.client.send(command);
    return {
      ETag: response.ETag,
      PartNumber: partNumber,
    };
  }

  /**
   * Completes a multipart upload in MinIO by assembling all uploaded parts.
   * @param bucket - The name of the bucket where the object is being uploaded.
   * @param objectName - The name/key of the object being uploaded.
   * @param uploadId - The ID of the multipart upload returned by startMultipart().
   * @param parts - An array of objects representing uploaded parts
   * @returns The response from MinIO after completing the multipart upload
   */
  async completeMultipart(
    bucket: string,
    objectName: string,
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[],
  ) {
    const command = new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: objectName,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
      },
    });
    const response = await this.client.send(command);
    this.logger.log(`Multipart upload complete for ${objectName}`);
    return response;
  }

  /**
   * Uploads a single file to MinIO with optional overwrite prevention
   * @param bucket - The name of the bucket where the file will be uploaded.
   * @param objectName - The name/key of the file to upload.
   * @param fileBuffer - The file data as Buffer.
   * @param preventOverwrite - Whether to generate unique name if file exists
   * @returns The response from MinIO and the final object name used
   */
  async uploadFile(
    bucket: string,
    objectName: string,
    fileBuffer: Buffer,
    preventOverwrite: boolean = true,
  ) {
    await this.ensureBucket(bucket);

    let finalObjectName = objectName;
    if (preventOverwrite) {
      finalObjectName = await this.generateUniqueObjectName(bucket, objectName);
    }

    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: finalObjectName,
        Body: fileBuffer,
      });

      const response = await this.client.send(command);
      this.logger.log(`File ${finalObjectName} uploaded to bucket ${bucket}`);

      return {
        ...response,
        originalName: objectName,
        finalName: finalObjectName,
        bucket: bucket,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file ${finalObjectName}:`, error);
      throw error;
    }
  }

  /**
   * Upload file with versioning (keeps both old and new versions)
   * @param bucket - The name of the bucket where the file will be uploaded.
   * @param objectName - The name/key of the file to upload.
   * @param fileBuffer - The file data as Buffer.
   * @returns The response from MinIO with version info
   */
  async uploadFileWithVersioning(
    bucket: string,
    objectName: string,
    fileBuffer: Buffer,
  ) {
    await this.ensureBucket(bucket);

    // Create versioned filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = path.extname(objectName);
    const nameWithoutExt = path.basename(objectName, ext);
    const versionedName = `${nameWithoutExt}_v${timestamp}${ext}`;

    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: versionedName,
        Body: fileBuffer,
        Metadata: {
          'original-name': objectName,
          'upload-timestamp': new Date().toISOString(),
        },
      });

      const response = await this.client.send(command);
      this.logger.log(
        `Versioned file ${versionedName} uploaded to bucket ${bucket}`,
      );

      return {
        ...response,
        originalName: objectName,
        versionedName: versionedName,
        bucket: bucket,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload versioned file ${versionedName}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get a link for the object stored in the bucket that will expire after 1H
   * @param bucket - The bucket name
   * @param fileName - The name of the file stored in the bucket
   * @param contentType - The content type of the file like PNG,PDF
   * @returns The response will give you temporary link for the file
   */
  async getFileLink(bucket: string, fileName: string, contentType: string) {
    const client = new S3Client({
      endpoint: process.env.MINIO_FILES_PATH,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY,
        secretAccessKey: process.env.MINIO_SECRET_KEY,
      },
    });

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileName,
      ResponseContentDisposition: 'inline',
      ResponseContentType: contentType,
    });

    const url = await getSignedUrl(client, command, { expiresIn: 3600 });
    return url;
  }
}
