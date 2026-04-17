import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret',
    });
  }

  async validate(payload: any) {
    const company = await this.prisma.company.findUnique({
      where: { id: payload.sub },
    });
    
    if (!company) {
      throw new UnauthorizedException();
    }
    
    return {
      id: payload.sub,
      walletAddress: payload.walletAddress,
      role: payload.role,
    };
  }
}
