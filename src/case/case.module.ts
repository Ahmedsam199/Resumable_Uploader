import { Module } from '@nestjs/common';
import { CaseController } from './case.controller';
import { CaseService } from './case.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [CaseController],
  providers: [CaseService, PrismaService],
})
export class CaseModule {}
