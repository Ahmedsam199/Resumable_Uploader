import { IsNotEmpty, IsString } from 'class-validator';

export class CaseDTO {
  @IsNotEmpty()
  @IsString()
  name: string;
}
