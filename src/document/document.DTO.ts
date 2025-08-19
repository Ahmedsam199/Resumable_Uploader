import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class DocumentDTO {
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsNumber()
  caseId: number;
}
