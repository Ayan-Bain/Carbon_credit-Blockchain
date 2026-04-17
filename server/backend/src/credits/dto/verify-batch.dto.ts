import { IsNumber, IsPositive } from 'class-validator';

export class VerifyBatchDto {
  @IsNumber()
  @IsPositive()
  quantity: number;
}
