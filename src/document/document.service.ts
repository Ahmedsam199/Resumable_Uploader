import { Injectable } from '@nestjs/common';
import { DocumentDTO } from './document.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DocumentService {
  constructor(private readonly prismaService: PrismaService) {}
  async getAll() {
    return await this.prismaService.document.findMany({
      orderBy: { id: 'desc' },
    });
  }
  async create(data: DocumentDTO) {
    return await this.prismaService.document.create({ data });
  }
}
