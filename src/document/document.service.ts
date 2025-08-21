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
  /**
   * Function to get all documents sorted by ids
   */
  async getAllDocumetns() {
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
  /**
   * Function to create new document
   */
  async createNewDocument(data: DocumentDTO) {
    try {
      return await this.prismaService.document.create({ data });
    } catch (error) {
      throw new HttpException(
        'Failed to create new document',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  /**
   * Function to get single document including all files related to this document with file link to access the file
   */
  async getDocumentById(id: number) {
    try {
      const document = await this.prismaService.document.findUnique({
        where: { id },
        include: { File: true },
      });

      if (!document) {
        throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
      }
      // Adding promise cause the minio file like is an async function
      const files = await Promise.all(
        document.File.map(async (file: any) => {
          const contentType = this.utils.getFileType(file.name);
          const fileLink = await this.minioService.getFileLink(
            'resumable',
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
