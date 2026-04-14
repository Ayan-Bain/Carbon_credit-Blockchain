import { Injectable, UnauthorizedException } from '@nestjs/common';
import { generateNonce, SiweMessage } from 'siwe';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private issuedNonces = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  generateNonce(): string {
    const nonce = generateNonce();
    this.issuedNonces.add(nonce);
    return nonce;
  }

  async verifySiwe(message: string, signature: string) {
    let siweMessage;
    try {
      const siweMsg = new SiweMessage(message);
      const result = await siweMsg.verify({ signature });
      
      // Handle response based on SIWE version difference
      if (result.success === false) {
         throw new UnauthorizedException('Invalid signature');
      }
      
      siweMessage = result.data || result;
    } catch (e) {
      throw new UnauthorizedException('Invalid SIWE message or signature');
    }

    if (!this.issuedNonces.has(siweMessage.nonce)) {
      throw new UnauthorizedException('Invalid or expired nonce');
    }

    // Consume the nonce to prevent replay attacks
    this.issuedNonces.delete(siweMessage.nonce);

    const walletAddress = siweMessage.address.toLowerCase();

    // Check if the company exists
    let company = await this.prisma.company.findUnique({
      where: { walletAddress },
    });

    // Create a new company with role BUYER if it doesn't exist
    if (!company) {
      company = await this.prisma.company.create({
        data: {
          name: 'New Company',
          walletAddress,
          role: CompanyRole.BUYER,
        },
      });
    }

    // Issue JWT Token
    const payload = {
      sub: company.id,
      walletAddress: company.walletAddress,
      role: company.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: company,
    };
  }
}
