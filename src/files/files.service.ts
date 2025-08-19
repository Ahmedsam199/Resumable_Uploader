import { Injectable } from '@nestjs/common';
import { MinioService } from 'src/minio/minio.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly minioService: MinioService,
  ) {}
  async startUpload(data: any) {
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
      console.log('Error completing upload:', error);
    }
  }
}
