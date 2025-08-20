import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { MinioService } from 'src/minio/minio.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('FilesService', () => {
  let service: FilesService;
  let minioService: MinioService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const minioServiceMock = {
      startMultipart: jest.fn(),
      uploadPart: jest.fn(),
      completeMultipart: jest.fn(),
    };
    const prismaServiceMock = {
      file: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: MinioService, useValue: minioServiceMock },
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    minioService = module.get<MinioService>(MinioService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startUpload', () => {
    it('should call minioService.startMultipart and return fileInfo', async () => {
      const data = { name: 'test.txt' };
      const fileInfo = { uploadId: '123', key: 'test.txt' };
      (minioService.startMultipart as jest.Mock).mockResolvedValue(fileInfo);

      const result = await service.startUpload(data);

      expect(minioService.startMultipart).toHaveBeenCalledWith(
        'resumable',
        data.name,
      );
      expect(result).toBe(fileInfo);
    });
  });

  describe('upload', () => {
    it('should call minioService.uploadPart and return result', async () => {
      const uploadResult = { ETag: 'etag' };
      (minioService.uploadPart as jest.Mock).mockResolvedValue(uploadResult);

      const result = await service.upload(
        'resumable',
        'file.txt',
        'uploadId',
        1,
        Buffer.from('data'),
      );

      expect(minioService.uploadPart).toHaveBeenCalledWith(
        'resumable',
        'file.txt',
        'uploadId',
        1,
        expect.any(Buffer),
      );
      expect(result).toBe(uploadResult);
    });
  });

  describe('completeUpload', () => {
    it('should complete multipart upload and create file record', async () => {
      (minioService.completeMultipart as jest.Mock).mockResolvedValue(
        undefined,
      );
      const fileRecord = {
        id: 1,
        name: 'file.txt',
        documentId: 2,
        path: 'http://localhost:9000/resumable/file.txt',
      };
      (prismaService.file.create as jest.Mock).mockResolvedValue(fileRecord);

      const result = await service.completeUpload(
        'resumable',
        'file.txt',
        'uploadId',
        [{ PartNumber: 1, ETag: 'etag' }],
        2,
      );

      expect(minioService.completeMultipart).toHaveBeenCalledWith(
        'resumable',
        'file.txt',
        'uploadId',
        [{ PartNumber: 1, ETag: 'etag' }],
      );
      expect(prismaService.file.create).toHaveBeenCalledWith({
        data: {
          name: 'file.txt',
          documentId: 2,
          path: 'http://localhost:9000/resumable/file.txt',
        },
      });
      expect(result).toBe(fileRecord);
    });

    it('should handle errors in completeUpload gracefully', async () => {
      const error = new Error('Upload failed');
      (minioService.completeMultipart as jest.Mock).mockRejectedValue(error);

      await expect(
        service.completeUpload('resumable', 'file.txt', 'uploadId', [], 2),
      ).rejects.toThrow('Upload failed');

      //Some AI used here for the Test
    });
  });
});
