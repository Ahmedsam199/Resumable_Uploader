import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CaseDTO } from './case.DTO';

@Injectable()
export class CaseService {
  constructor(private readonly prismaService: PrismaService) {}
  async findAll() {
    return this.prismaService.case.findMany();
  }
  async create(data: CaseDTO) {
    return this.prismaService.case.create({ data });
  }
}
