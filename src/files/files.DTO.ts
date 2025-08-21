import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class StartigUploadDTO {
  @ApiProperty({
    description: 'Name of the file',
    type: String,
    example: 'filename.png',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}
export class FileUploadDTO {
  @ApiProperty({
    description: 'Name of the object',
    type: String,
    example: 'objectName',
  })
  @IsNotEmpty()
  @IsString()
  objectName: string;
  @ApiProperty({
    description: 'upload id of the file',
    type: String,
    example: 'uploadId',
  })
  @IsNotEmpty()
  @IsString()
  uploadId: string;
  @ApiProperty({
    description: 'Part number of the chunk',
    type: Number,
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  partNumber: number;
}
export class CompleteUploadDTO {
  @ApiProperty({
    description: 'objectName of the file',
    type: String,
    example: 'objectName',
  })
  @IsNotEmpty()
  @IsString()
  objectName: string;
  @ApiProperty({
    description: 'uploadId of the file',
    type: String,
    example: 'uploadId',
  })
  @IsNotEmpty()
  @IsString()
  uploadId;
  @ApiProperty({
    description: 'uploadId of the file',
    type: Array,
    example: [{ ETage: '423424131', partNumber: 1 }],
  })
  @IsNotEmpty()
  @IsArray()
  parts: Array<any>;
  @ApiProperty({
    description: 'uploadId of the file',
    type: Number,
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  documentId;
}
