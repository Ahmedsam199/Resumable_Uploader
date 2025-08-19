import { Body, Controller, Get, Post } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentDTO } from './document.dto';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}
  @Get()
  async getAllDocuments() {
    return this.documentService.getAll();
  }
  @Post()
  async createDocument(@Body() data: DocumentDTO) {
    return await this.documentService.create(data);
  }
}
