import { IsEnum, IsString, IsBoolean } from 'class-validator';
import { CompanyRole } from '@prisma/client';

export class UpdateRoleDto {
  @IsString()
  walletAddress: string;

  @IsEnum(CompanyRole)
  role: CompanyRole;

  @IsBoolean()
  grant: boolean;
}
