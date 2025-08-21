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
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class MinioService {
  private readonly logger = new Logger(MinioService.name);
  private client: S3Client;
  //:TODO: put this in .env file (:
  constructor() {
    this.client = new S3Client({
      endpoint: process.env.MINIO_PUBLIC_ENDPOINT || 'http://minio:9000',
      region: 'us-east-1',
      forcePathStyle: true,

      credentials: {
        accessKeyId: 'minioadmin',
        secretAccessKey: 'minioadmin',
      },
    });
  }
  /**
   * Ensuring the bucket already exist in the minio if not it will be created
   * @param bucket - String provided by user
   * @returns URL string of uploaded file
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
   * Starts a multipart upload for an object in MinIO.
   * Ensures that the specified bucket exists; if not, it will be created.
   *
   * @param bucket - The name of the bucket where the object will be uploaded.
   * @param objectName - The name/key of the object to upload.
   * @returns An object containing the uploadId, key, and bucket name for the multipart upload.
   */
  async startMultipart(bucket: string, objectName: string) {
    await this.ensureBucket(bucket);
    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: objectName,
    });
    const response = await this.client.send(command);
    return {
      uploadId: response.UploadId,
      key: response.Key,
      bucket: bucket,
    };
  }
  /**
   * Uploads a single part of a multipart upload to MinIO.
   *
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
   *
   * @param bucket - The name of the bucket where the object is being uploaded.
   * @param objectName - The name/key of the object being uploaded.
   * @param uploadId - The ID of the multipart upload returned by startMultipart().
   * @param parts - An array of objects representing uploaded parts, each containing:
   *   - ETag: The ETag returned by MinIO for that part.
   *   - PartNumber: The sequential part number of that part.
   * @returns The response from MinIO after completing the multipart upload and store the file to the bucket.
   *
   * @remarks
   * The parts array will be sorted by PartNumber before completing the upload.
   * A log entry will be created indicating that the multipart upload is complete.
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
   * Completes a multipart upload in MinIO by assembling all uploaded parts.
   *
   * @param bucket - The name of the bucket where the object is being uploaded.
   * @param objectName - The name/key of the object being uploaded.
   * @param fileBuffer - The ID of the multipart upload returned by startMultipart().
   * @returns The response from MinIO after uploading a singl file.
   *
   * @remarks
   * The parts array will be sorted by PartNumber before completing the upload.
   * A log entry will be created indicating that the multipart upload is complete.
   */

  async uploadFile(bucket: string, objectName: string, fileBuffer: Buffer) {
    await this.ensureBucket(bucket);

    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: objectName,
        Body: fileBuffer,
      });

      const response = await this.client.send(command);
      this.logger.log(`File ${objectName} uploaded to bucket ${bucket}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to upload file ${objectName}:`, error);
      throw error;
    }
  }
  /**
   * Get a link for the object thats store in the bucket that will expire and cannot be view after 1H
   *
   * @param fileName - The name of the file thats stored in the bucket
   * @param contentType - The content type of the file like PNG,PDF.
   
   * @returns The response will give you temporary link for the file.
   */
  async getFileLink(bucket: string, fileName: string, contentType: string) {
    const client = new S3Client({
      endpoint: process.env.MINIO_FILES_PATH || 'http://localhost:9000',
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: 'minioadmin',
        secretAccessKey: 'minioadmin',
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
