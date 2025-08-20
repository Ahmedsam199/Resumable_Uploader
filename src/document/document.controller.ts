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
import { DocumentDTO } from '../document/document.DTO';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}
  /**
   * API Endpoint to get All documents
   */
  @Get()
  async getAllDocuments() {
    return this.documentService.getAllDocumetns();
  }
  /**
   * API Endpoint to create new document
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDocument(@Body() data: DocumentDTO) {
    return await this.documentService.createNewDocument(data);
  }
  /**
   * API Endpoint to retreve document by id
   */
  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.documentService.getDocumentById(+id);
  }
}
