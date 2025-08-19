import { Test, TestingModule } from '@nestjs/testing';
import { CaseController } from './case.controller';
import { CaseService } from './case.service';

describe('CaseController', () => {
  let controller: CaseController;
  const mockCaseService = {
    // mock any methods your controller calls
    createCase: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaseController],
      providers: [{ provide: CaseService, useValue: mockCaseService }],
    }).compile();

    controller = module.get<CaseController>(CaseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
