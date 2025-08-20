import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CaseModule } from './case/case.module';
import { DocumentModule } from './document/document.module';
import { MinioService } from './minio/minio.service';
import { FilesModule } from './files/files.module';
import { UtilService } from './util/util.service';

@Module({
  imports: [PrismaModule, CaseModule, DocumentModule, FilesModule],
  controllers: [AppController],
  providers: [AppService, MinioService, UtilService],
})
export class AppModule {}
