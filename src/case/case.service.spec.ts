import { Test, TestingModule } from '@nestjs/testing';
import { CaseService } from './case.service';
import { PrismaService } from 'src/prisma/prisma.service'; // actual class

const prismaMock = {
  case: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

describe('CaseService', () => {
  let service: CaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaseService,
        { provide: PrismaService, useValue: prismaMock }, // <-- use the class, not a string
      ],
    }).compile();

    service = module.get<CaseService>(CaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCase', () => {
    it('should return a case by id', async () => {
      const expectedCases = [{ id: 1, name: 'test case' }];
      prismaMock.case.findMany.mockResolvedValue(expectedCases);

      const result = await service.getCases();
      expect(result).toEqual(expectedCases);
      expect(prismaMock.case.findMany).toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    it('should create and return the user', async () => {
      const data = { name: 'new case' };
      const createdCase = { id: 2, ...data };
      prismaMock.case.create.mockResolvedValue(createdCase);

      const result = await service.createCase(data);
      expect(result).toEqual(createdCase);
      expect(prismaMock.case.create).toHaveBeenCalledWith({ data });
    });
  });
});
