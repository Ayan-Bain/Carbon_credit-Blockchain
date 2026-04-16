import { AuthService } from './auth.service';
import { CompanyRole } from '@prisma/client';
import { VerifySiweDto } from './dto/verify-siwe.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getNonce(): {
        nonce: string;
    };
    register(body: {
        name: string;
        walletAddress: string;
        role?: CompanyRole;
    }): Promise<{
        id: string;
        name: string;
        walletAddress: string;
        role: import("@prisma/client").$Enums.CompanyRole;
        kycVerified: boolean;
        createdAt: Date;
    }>;
    login(body: VerifySiweDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            walletAddress: string;
            role: import("@prisma/client").$Enums.CompanyRole;
            kycVerified: boolean;
            createdAt: Date;
        };
    }>;
}
