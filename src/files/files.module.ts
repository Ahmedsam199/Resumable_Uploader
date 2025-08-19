import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MinioService } from 'src/minio/minio.service';

@Module({
  controllers: [FilesController],
  providers: [FilesService, PrismaService, MinioService],
})
export class FilesModule {}
