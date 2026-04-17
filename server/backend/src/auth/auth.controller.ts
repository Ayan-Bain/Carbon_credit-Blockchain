import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CompanyRole } from '@prisma/client';
import { VerifySiweDto } from './dto/verify-siwe.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('nonce')
  getNonce() {
    return { nonce: this.authService.generateNonce() };
  }

  @Post('register')
  async register(@Body() body: { name: string; walletAddress: string; role?: CompanyRole }) {
    return this.authService.register(body.name, body.walletAddress, body.role);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: VerifySiweDto) {
    return this.authService.verifySiwe(body.message, body.signature);
  }
}
