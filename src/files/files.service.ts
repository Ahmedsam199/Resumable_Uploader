import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { MinioService } from 'src/minio/minio.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { StartigUploadDTO } from './files.DTO';
/**
 * Service for handling file uploads using MinIO.
 * Provides methods to start, upload parts, and complete multipart uploads.
 * Also stores file metadata in the database using Prisma.
 */
@Injectable()
export class FilesService {
  private readonly defaultBucket = 'resumable';

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}
  /**
   * Initiates a multipart upload for a file in the default bucket.
   *
   * @param data - DTO containing file metadata (e.g., name of the file).
   * @returns An object containing the uploadId, key, and bucket name.
   * @throws HttpException if starting the upload fails.
   */
  async startUploadNewFile(data: StartigUploadDTO) {
    try {
      return await this.minio.startMultipart(this.defaultBucket, data.name);
    } catch (error) {
      throw new HttpException(
        'Failed to start upload',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  /**
   * Uploads a single part of a file to MinIO.
   *
   * @param bucket - The name of the bucket where the file is being uploaded.
   *                 If not provided, defaults to the service's defaultBucket.
   * @param objectName - The name/key of the file being uploaded.
   * @param uploadId - The ID of the multipart upload returned by startUpload().
   * @param partNumber - The sequential part number (starting from 1) of this upload.
   * @param body - The data to upload for this part (Buffer, Uint8Array, or Blob).
   * @returns An object containing the ETag returned by MinIO and the part number.
   * @throws HttpException with status 500 if the upload fails.
   */
  async uploadFileChunk(
    bucket: string,
    objectName: string,
    uploadId: string,
    partNumber: number,
    body: Buffer | Uint8Array | Blob,
  ) {
    try {
      return await this.minio.uploadPart(
        bucket || this.defaultBucket,
        objectName,
        uploadId,
        partNumber,
        body,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to upload part',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  /**
   * Completes a multipart upload in MinIO and stores file metadata in the database.
   *
   * @param bucket - The name of the bucket where the file was uploaded.
   *                 If not provided, defaults to the service's defaultBucket.
   * @param objectName - The name/key of the file being uploaded.
   * @param uploadId - The ID of the multipart upload returned by startUpload().
   * @param parts - An array of uploaded parts, each containing:
   *                - ETag: The ETag returned by MinIO for that part.
   *                - PartNumber: The sequential part number of the part.
   * @param documentId - The ID of the related document to associate the file with in the database.
   * @returns The created file record in the database, including its name and path.
   * @throws HttpException with status 500 if completing the upload or saving to the database fails.
   */
  async completeUploadingFile(
    bucket: string,
    objectName: string,
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[],
    documentId: number,
  ) {
    try {
      await this.minio.completeMultipart(
        bucket || this.defaultBucket,
        objectName,
        uploadId,
        parts,
      );

      return await this.prisma.file.create({
        data: {
          name: objectName,
          documentId,
          path: `${bucket || this.defaultBucket}/${objectName}`,
        },
      });
    } catch (error) {
      throw new HttpException(
        'Failed to complete upload',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
