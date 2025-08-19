import { Body, Controller, Get, Post } from '@nestjs/common';
import { CaseService } from './case.service';
import { CaseDTO } from './case.DTO';

@Controller('case')
export class CaseController {
  constructor(private readonly caseService: CaseService) {}
  @Get('')
  async getCases() {
    return await this.caseService.getCases();
  }
  @Post('')
  async createCase(@Body() data: CaseDTO) {
    return await this.caseService.createCase(data);
  }
}
