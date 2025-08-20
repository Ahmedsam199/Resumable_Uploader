import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CaseService } from './case.service';
import { CaseDTO } from './case.DTO';

@Controller('case')
export class CaseController {
  constructor(private readonly caseService: CaseService) {}
  /**
   * API Endpoint to get cases
   */
  @Get('')
  async getCases() {
    return await this.caseService.getCases();
  }
  /**
   * API Endpoint to create cases
   */
  @Post('')
  @HttpCode(HttpStatus.CREATED)
  async createCase(@Body() data: CaseDTO) {
    return await this.caseService.createCase(data);
  }
  /**
   * API Endpoint to get single case by Id
   */
  @Get(':id')
  async getCaseById(@Param('id') id: string) {
    return await this.caseService.getCaseById(+id);
  }
}
