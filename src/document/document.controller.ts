import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
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
  @HttpCode(HttpStatus.CREATED)
  async createDocument(@Body() data: DocumentDTO) {
    return await this.documentService.create(data);
  }
  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.documentService.getById(+id);
  }
}
