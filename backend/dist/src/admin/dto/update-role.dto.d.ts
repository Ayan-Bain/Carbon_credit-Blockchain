import { CompanyRole } from '@prisma/client';
export declare class UpdateRoleDto {
    walletAddress: string;
    role: CompanyRole;
    grant: boolean;
}
