import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DocumentDTO {
  @ApiProperty({
    description: 'Name of the document',
    type: String,
    example: 'New Document',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'ID of the case this document belongs to',
    type: Number,
    example: 1,
  })
  @IsNumber()
  caseId: number;
}
