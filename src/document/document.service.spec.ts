import { Test, TestingModule } from '@nestjs/testing';
import { DocumentService } from './document.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UtilService } from 'src/util/util.service';
import { MinioService } from 'src/minio/minio.service';
import { DocumentDTO } from './document.DTO';
let service: DocumentService;
let prisma: PrismaService;
beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [DocumentService, PrismaService, UtilService, MinioService],
  }).compile();

  prisma = module.get<PrismaService>(PrismaService);
  service = module.get<DocumentService>(DocumentService);
});

describe('DocumentService', () => {
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
describe('Get Documents', () => {
  it('Should Return Documents', async () => {
    const data = await service.getAllDocumetns();
    expect(data).toBeDefined();
  });
});
describe('Create a Documents', () => {
  it('Should Return Documents', async () => {
    const newCase = await prisma.case.create({
      data: { name: 'Testing case' },
    });
    const data: DocumentDTO = { name: 'New Document', caseId: newCase.id };
    const createdDocument = await service.createNewDocument(data);
    expect(createdDocument).toBeDefined();
    expect(createdDocument.name).toBe(data.name);
  });
});
describe('Get a Document By id', () => {
  it('Should Return Document with id', async () => {
    const DocumentId = 5;
    const Document = await service.getDocumentById(DocumentId);
    expect(Document).toBeDefined();
  });
});
