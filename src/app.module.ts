import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CaseModule } from './case/case.module';
import { DocumentModule } from './document/document.module';
import { MinioService } from './minio/minio.service';
import { FilesModule } from './files/files.module';

@Module({
  imports: [PrismaModule, CaseModule, DocumentModule, FilesModule],
  controllers: [AppController],
  providers: [AppService, MinioService],
})
export class AppModule {}
