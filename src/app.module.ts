import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CaseModule } from './case/case.module';
import { DocumentModule } from './document/document.module';

@Module({
  imports: [PrismaModule, CaseModule, DocumentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
