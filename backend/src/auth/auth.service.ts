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

  async register(name: string, walletAddress: string, role?: CompanyRole) {
    const address = walletAddress.toLowerCase();
    let company = await this.prisma.company.findUnique({
      where: { walletAddress: address },
    });
    if (company) {
      throw new UnauthorizedException('Company already registered');
    }
    
    return this.prisma.company.create({
      data: {
        name,
        walletAddress: address,
        role: role || CompanyRole.BUYER,
      },
    });
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

    // Check if it's the admin
    const adminAddress = process.env.ADMIN_WALLET_ADDRESS?.toLowerCase();
    const isLocalAdmin = walletAddress === adminAddress;

    // Create a new company if it doesn't exist
    if (!company) {
      company = await this.prisma.company.create({
        data: {
          name: isLocalAdmin ? 'System Admin' : 'New Company',
          walletAddress,
          role: isLocalAdmin ? CompanyRole.ADMIN : CompanyRole.BUYER,
        },
      });
    } else if (isLocalAdmin && company.role !== CompanyRole.ADMIN) {
      // Auto-upgrade existing record if it matches admin address
      company = await this.prisma.company.update({
        where: { id: company.id },
        data: { role: CompanyRole.ADMIN },
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
