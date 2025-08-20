import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UtilService } from 'src/util/util.service';
import { MinioService } from 'src/minio/minio.service';
import { DocumentDTO } from '../document/document.DTO';

@Injectable()
export class DocumentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly utils: UtilService,
    private readonly minioService: MinioService,
  ) {}
  async getAll() {
    try {
      return await this.prismaService.document.findMany({
        orderBy: { id: 'desc' },
      });
    } catch (error) {
      throw new HttpException(
        'Failed to fetch cases',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async create(data: DocumentDTO) {
    try {
      return await this.prismaService.document.create({ data });
    } catch (error) {
      throw new HttpException(
        'Failed to create new document',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getById(id: number) {
    try {
      const document = await this.prismaService.document.findUnique({
        where: { id },
        include: { File: true },
      });

      if (!document) {
        throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
      }
      const files = await Promise.all(
        document.File.map(async (file: any) => {
          const contentType = this.utils.getFileType(file.name);
          const fileLink = await this.minioService.getFileLink(
            file.name,
            contentType,
          );

          return {
            name: file.name,
            contentType,
            fileLink,
          };
        }),
      );

      return {
        ...document,
        File: files,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch document by ID',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
