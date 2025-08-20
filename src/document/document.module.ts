import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UtilService } from 'src/util/util.service';
import { MinioService } from 'src/minio/minio.service';

@Module({
  controllers: [DocumentController],
  providers: [DocumentService, PrismaService, UtilService, MinioService],
})
export class DocumentModule {}
