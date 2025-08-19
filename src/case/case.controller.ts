import { Body, Controller, Get, Post } from '@nestjs/common';
import { CaseService } from './case.service';
import { CaseDTO } from './case.DTO';

@Controller('case')
export class CaseController {
  constructor(private readonly caseService: CaseService) {}
  @Get()
  async findAll() {
    return this.caseService.findAll();
  }
  @Post()
  async create(@Body() data: CaseDTO) {
    return this.caseService.create(data);
  }
}
