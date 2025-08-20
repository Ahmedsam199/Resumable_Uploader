import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class StartigUploadDTO {
  @IsNotEmpty()
  @IsString()
  name: string;
}
export class FileUploadDTO {
  @IsNotEmpty()
  @IsString()
  objectName: string;
  @IsNotEmpty()
  @IsString()
  uploadId: string;
  @IsNotEmpty()
  @IsNumber()
  partNumber: number;
}
export class CompleteUploadDTO {
  @IsNotEmpty()
  @IsString()
  objectName: string;
  @IsNotEmpty()
  @IsString()
  uploadId;
  @IsNotEmpty()
  @IsArray()
  parts: Array<any>;
  @IsNotEmpty()
  @IsNumber()
  documentId;
}
