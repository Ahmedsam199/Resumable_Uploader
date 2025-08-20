import { Injectable } from '@nestjs/common';
import { MinioService } from 'src/minio/minio.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { StartigUploadDTO } from './files.DTO';

@Injectable()
export class FilesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly minioService: MinioService,
  ) {}
  async startUpload(data: StartigUploadDTO) {
    const fileInfo = await this.minioService.startMultipart(
      'resumable',
      data.name,
    );
    return fileInfo;
  }
  async upload(
    bucket: string,
    objectName: string,
    uploadId: string,
    partNumber: number,
    body: Buffer | Uint8Array | Blob,
  ) {
    return await this.minioService.uploadPart(
      'resumable',
      objectName,
      uploadId,
      partNumber,
      body,
    );
  }
  async completeUpload(
    bucket: string,
    objectName: string,
    uploadId: string,
    parts: any[],
    documentId: number,
  ) {
    try {
      await this.minioService.completeMultipart(
        'resumable',
        objectName,
        uploadId,
        parts,
      );
      return await this.prismaService.file.create({
        data: {
          name: objectName,
          documentId: documentId,
          path: `http://localhost:9000/resumable/${objectName}`,
        },
      });
    } catch (error) {
      throw new Error('Upload failed');
    }
  }
}
