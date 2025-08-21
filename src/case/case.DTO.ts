import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CaseDTO {
  @ApiProperty({
    description: 'Name of the Case',
    type: String,
    example: 'New Case',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}
