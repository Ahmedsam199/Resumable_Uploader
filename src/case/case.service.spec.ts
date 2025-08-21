import { Test, TestingModule } from '@nestjs/testing';
import { CaseService } from './case.service';
import { PrismaService } from '../prisma/prisma.service';
import { CaseDTO } from './case.DTO';
let service: CaseService;
let prisma: PrismaService;
beforeAll(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [CaseService, PrismaService],
  }).compile();

  service = module.get<CaseService>(CaseService);
  prisma = module.get<PrismaService>(PrismaService);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('CaseService', () => {
  it('Shuold be defined', async () => {
    expect(service).toBeDefined();
  });
});
describe('Get Cases', () => {
  it('should return all cases from database', async () => {
    const cases = await service.getCases();
    expect(cases).toBeDefined();
  });
});
describe('Create a Case', () => {
  it('Shuould Create a case', async () => {
    const data: CaseDTO = { name: 'New Case' };
    const newCase = await service.createCase(data);
    expect(newCase.name).toBe(data.name);
  });
});
