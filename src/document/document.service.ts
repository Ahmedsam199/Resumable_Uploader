import { Injectable } from '@nestjs/common';
import { DocumentDTO } from './document.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UtilService } from 'src/util/util.service';
import { MinioService } from 'src/minio/minio.service';

@Injectable()
export class DocumentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly utils: UtilService,
    private readonly minioService: MinioService,
  ) {}
  async getAll() {
    return await this.prismaService.document.findMany({
      orderBy: { id: 'desc' },
    });
  }
  async create(data: DocumentDTO) {
    return await this.prismaService.document.create({ data });
  }
  // In your service class

  async getById(id: number) {
    const data = await this.prismaService.document.findUnique({
      where: { id },
      include: { File: true },
    });
    const files = await Promise.all(
      data.File.map(async (file: any) => ({
        name: file.name,
        contentType: this.utils.getFileType(file.name),
        fileLink: await this.minioService.getFileLink(
          file.name,
          this.utils.getFileType(file.name),
        ),
      })),
    );
    return {
      ...data,
      File: files,
    };
  }
}
