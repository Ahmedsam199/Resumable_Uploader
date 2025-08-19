import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CaseDTO } from './case.DTO';

@Injectable()
export class CaseService {
  constructor(private readonly prismaService: PrismaService) {}
  async getCases() {
    return await this.prismaService.case.findMany({ orderBy: { id: 'desc' } });
  }
  async createCase(data: CaseDTO) {
    return await this.prismaService.case.create({ data });
  }
  async getCaseById(id: number) {
    return await this.prismaService.case.findUnique({
      where: { id },
      include: { Document: true },
    });
  }
}
