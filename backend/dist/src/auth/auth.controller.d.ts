import { AuthService } from './auth.service';
import { VerifySiweDto } from './dto/verify-siwe.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getNonce(): {
        nonce: string;
    };
    verify(body: VerifySiweDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            walletAddress: string;
            role: import(".prisma/client").$Enums.CompanyRole;
            kycVerified: boolean;
            createdAt: Date;
        };
    }>;
}
