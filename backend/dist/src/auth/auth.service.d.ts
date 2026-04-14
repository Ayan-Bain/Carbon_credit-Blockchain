import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private issuedNonces;
    constructor(prisma: PrismaService, jwtService: JwtService);
    generateNonce(): string;
    verifySiwe(message: string, signature: string): Promise<{
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
