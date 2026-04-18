import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { generateNonce, SiweMessage } from 'siwe';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyRole } from '@prisma/client';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class AuthService {
  private issuedNonces = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly blockchainService: BlockchainService,
  ) {}

  generateNonce(): string {
    const nonce = generateNonce();
    this.issuedNonces.add(nonce);
    return nonce;
  }

  async register(name: string, walletAddress: string, role?: CompanyRole) {
    if (role === CompanyRole.ADMIN || role === CompanyRole.REGULATOR || role === CompanyRole.MINTER) {
      throw new BadRequestException('Cannot register as an ADMIN, REGULATOR, or MINTER. These roles must be granted by an existing Admin.');
    }

    const address = walletAddress;
    let company = await this.prisma.company.findUnique({
      where: { walletAddress: address },
    });
    if (company) {
      throw new UnauthorizedException('Company already registered');
    }

    // Grant role on-chain if applicable
    if (role === CompanyRole.PRODUCER || role === CompanyRole.BUYER) {
      try {
        await this.blockchainService.setOnChainRole(address, role, true);
      } catch (e) {
        throw new BadRequestException('Failed to grant role on-chain. Check if the admin system has sufficient balance.');
      }
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

    const walletAddress = siweMessage.address;

    // Check if the company exists
    let company = await this.prisma.company.findUnique({
      where: { walletAddress },
    });

    // Check if it's the admin
    const adminAddress = process.env.ADMIN_WALLET_ADDRESS;
    const isLocalAdmin = walletAddress.toLowerCase() === adminAddress?.toLowerCase();

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

  async getProfile(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });
    if (!company) {
      throw new UnauthorizedException('User not found');
    }
    return company;
  }

  async getCompanyById(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });
    if (!company) {
      throw new BadRequestException('Company not found');
    }
    return company;
  }
}
