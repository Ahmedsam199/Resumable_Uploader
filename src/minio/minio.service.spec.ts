import { Test, TestingModule } from '@nestjs/testing';
import { MinioService } from './minio.service';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// AI used here to test the minio service
let mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3');
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('MinioService', () => {
  let service: MinioService;

  beforeEach(async () => {
    mockSend.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [MinioService],
    }).compile();
    service = module.get<MinioService>(MinioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ensureBucket', () => {
    it('should create bucket if not exists', async () => {
      mockSend
        .mockResolvedValueOnce({ Buckets: [] }) // ListBuckets
        .mockResolvedValueOnce({}); // CreateBucket

      await service.ensureBucket('my-bucket');
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should not create bucket if already exists', async () => {
      mockSend.mockResolvedValueOnce({ Buckets: [{ Name: 'my-bucket' }] });
      await service.ensureBucket('my-bucket');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should throw if ListBucketsCommand fails', async () => {
      mockSend.mockRejectedValueOnce(new Error('fail'));
      await expect(service.ensureBucket('bad-bucket')).rejects.toThrow(
        'Upload failed',
      );
    });
  });

  describe('startMultipart', () => {
    it('should return upload info', async () => {
      mockSend
        .mockResolvedValueOnce({ Buckets: [] }) // ensureBucket
        .mockResolvedValueOnce({}) // CreateBucket
        .mockResolvedValueOnce({ UploadId: '123', Key: 'file.txt' });

      const result = await service.startMultipart('bucket', 'file.txt');
      expect(result).toEqual({
        uploadId: '123',
        key: 'file.txt',
        bucket: 'bucket',
      });
    });
  });

  describe('uploadPart', () => {
    it('should upload a part and return ETag/PartNumber', async () => {
      mockSend.mockResolvedValueOnce({ ETag: 'etag-xyz' });
      const result = await service.uploadPart(
        'bucket',
        'file.txt',
        '123',
        1,
        Buffer.from('data'),
      );
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ETag: 'etag-xyz', PartNumber: 1 });
    });
  });

  describe('completeMultipart', () => {
    it('should complete multipart upload', async () => {
      mockSend.mockResolvedValueOnce({ Location: 'some-url' });
      const result = await service.completeMultipart(
        'bucket',
        'file.txt',
        '123',
        [{ PartNumber: 1, ETag: 'etag-xyz' }],
      );
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ Location: 'some-url' });
    });
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      mockSend
        .mockResolvedValueOnce({ Buckets: [] }) // ensureBucket
        .mockResolvedValueOnce({}) // CreateBucket
        .mockResolvedValueOnce({}); // PutObject
      const result = await service.uploadFile(
        'bucket',
        'file.txt',
        Buffer.from('data'),
      );
      expect(mockSend).toHaveBeenCalledTimes(3);
      expect(result).toEqual({});
    });

    it('should throw if PutObjectCommand fails', async () => {
      mockSend
        .mockResolvedValueOnce({ Buckets: [] }) // ensureBucket
        .mockResolvedValueOnce({}) // CreateBucket
        .mockRejectedValueOnce(new Error('fail'));
      await expect(
        service.uploadFile('bucket', 'file.txt', Buffer.from('data')),
      ).rejects.toThrow('fail');
    });
  });

  describe('getFileLink', () => {
    it('should return signed url', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue('http://signed-url');
      const url = await service.getFileLink('file.txt', 'text/plain');
      expect(url).toBe('http://signed-url');
    });
  });
});
