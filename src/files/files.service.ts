import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { MinioService } from 'src/minio/minio.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { StartigUploadDTO } from './files.DTO';

@Injectable()
export class FilesService {
  private readonly defaultBucket = 'resumable';

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  async startUpload(data: StartigUploadDTO) {
    try {
      return await this.minio.startMultipart(this.defaultBucket, data.name);
    } catch (error) {
      throw new HttpException(
        'Failed to start upload',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async upload(
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

  async completeUpload(
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
          path: `http://localhost:9000/${bucket || this.defaultBucket}/${objectName}`,
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
