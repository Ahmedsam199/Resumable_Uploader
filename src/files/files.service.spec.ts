import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { MinioService } from 'src/minio/minio.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpException } from '@nestjs/common';
// AI used here to test the file service
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
      file: { create: jest.fn() },
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

      const result = await service.startUploadNewFile(data);

      expect(minioService.startMultipart).toHaveBeenCalledWith(
        'resumable',
        data.name,
      );
      expect(result).toBe(fileInfo);
    });

    it('should throw HttpException if startMultipart fails', async () => {
      (minioService.startMultipart as jest.Mock).mockRejectedValue(
        new Error('boom'),
      );

      await expect(
        service.startUploadNewFile({ name: 'bad.txt' }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('upload', () => {
    it('should call minioService.uploadPart and return result', async () => {
      const uploadResult = { ETag: 'etag' };
      (minioService.uploadPart as jest.Mock).mockResolvedValue(uploadResult);

      const result = await service.uploadFileChunk(
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

    it('should throw HttpException if uploadPart fails', async () => {
      (minioService.uploadPart as jest.Mock).mockRejectedValue(
        new Error('fail'),
      );
      await expect(
        service.uploadFileChunk(
          'resumable',
          'file.txt',
          'uploadId',
          1,
          Buffer.from('data'),
        ),
      ).rejects.toThrow(HttpException);
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

      const result = await service.completeUploadingFile(
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
          path: 'resumable/file.txt',
        },
      });
      expect(result).toBe(fileRecord);
    });

    it('should throw HttpException if completeMultipart fails', async () => {
      (minioService.completeMultipart as jest.Mock).mockRejectedValue(
        new Error('fail'),
      );
      await expect(
        service.completeUploadingFile(
          'resumable',
          'file.txt',
          'uploadId',
          [],
          2,
        ),
      ).rejects.toThrow(HttpException);
    });
  });
});
