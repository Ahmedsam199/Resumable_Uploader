import { Test, TestingModule } from '@nestjs/testing';
import { MinioService } from './minio.service';
import { S3Client } from '@aws-sdk/client-s3';
import { mock } from 'node:test';
let mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    CreateMultipartUploadCommand:
      jest.requireActual('@aws-sdk/client-s3').CreateMultipartUploadCommand,
    UploadPartCommand:
      jest.requireActual('@aws-sdk/client-s3').UploadPartCommand,
    CompleteMultipartUploadCommand:
      jest.requireActual('@aws-sdk/client-s3').CompleteMultipartUploadCommand,
    ListBucketsCommand:
      jest.requireActual('@aws-sdk/client-s3').ListBucketsCommand,
    CreateBucketCommand:
      jest.requireActual('@aws-sdk/client-s3').CreateBucketCommand,
    ListPartsCommand: jest.requireActual('@aws-sdk/client-s3').ListPartsCommand,
    PutObjectCommand: jest.requireActual('@aws-sdk/client-s3').PutObjectCommand,
  };
});
describe('MinioService', () => {
  let service: MinioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MinioService],
    }).compile();

    service = module.get<MinioService>(MinioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('startMultipart', () => {
    it('should start initializing the upload', async () => {
      const bucket = 'test-bucket';
      const objectName = 'test-file.txt';

      mockSend.mockResolvedValueOnce({ Buckets: [] });

      mockSend.mockResolvedValueOnce({});

      mockSend.mockResolvedValueOnce({
        UploadId: 'upload-123-abc',
        Key: objectName,
      });

      const result = await service.startMultipart(bucket, objectName);

      expect(result).toEqual({
        uploadId: 'upload-123-abc',
        key: objectName,
        bucket,
      });

      expect(mockSend).toHaveBeenCalledTimes(3);
    });
  });
  describe('uploadPart', () => {
    it('Should upload a chunk', async () => {
      const bucket = 'test-bucket';
      const objectName = 'test-file.txt';
      const uploadId = 'upload-123-abc';
      const partNumber = 1;
      const body = Buffer.from('test chunk');

      // 1st call: ListBucketsCommand → bucket does not exist
      mockSend.mockResolvedValueOnce({ Buckets: [] });

      // 2nd call: CreateBucketCommand → bucket created successfully
      mockSend.mockResolvedValueOnce({});

      // 3rd call: UploadPartCommand → returns the actual ETag
      mockSend.mockResolvedValueOnce({});

      const result = await service.uploadPart(
        bucket,
        objectName,
        uploadId,
        partNumber,
        body,
      );

      expect(result).toEqual({ ETag: result.ETag, PartNumber: partNumber });
      expect(mockSend).toHaveBeenCalledTimes(4);
      // Ai used here to write the test case
    });
  });
  describe('completeMultipart', () => {
    it('should combine the file and save it', async () => {
      const bucket = 'test-bucket';
      const objectName = 'test-file.txt';
      const uploadId = 'upload-123-abc';
      const parts = [{ PartNumber: 1, ETag: 'etag-123' }];
      const result = await service.completeMultipart(
        bucket,
        objectName,
        uploadId,
        parts,
      );
      expect(result).toBeDefined();
      expect(mockSend).toHaveBeenCalledTimes(5);
    });
  });
});
