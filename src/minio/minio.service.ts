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
      endpoint: 'http://localhost:9000',
      region: 'us-east-1',
      forcePathStyle: true,

      credentials: {
        accessKeyId: 'minioadmin',
        secretAccessKey: 'minioadmin',
      },
    });
  }

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
  // The client Start the multipart will get an id and key
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
  // the user will upload chunks and recive ETage and part number
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
  // The user will call this to complete the multipart upload and merge all parts
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
  // List all parts of a multipart upload

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
  async getFileLink(fileName: string, contentType: string) {
    const command = new GetObjectCommand({
      Bucket: 'resumable',
      Key: fileName,
      ResponseContentDisposition: 'inline',
      ResponseContentType: contentType,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn: 3600 }); // 1 hour expiry

    return url;
  }
}
