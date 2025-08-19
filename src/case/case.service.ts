import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CaseService {
  constructor(private readonly prismaService: PrismaService) {}
  async getCases() {
    return await this.prismaService.case.findMany({ orderBy: { id: 'desc' } });
  }
  async createCase(data: any) {
    return await this.prismaService.case.create({ data });
  }
}
