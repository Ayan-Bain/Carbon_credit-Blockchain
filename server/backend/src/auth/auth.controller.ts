import { Controller, Get, Post, Body, HttpCode, HttpStatus, UseGuards, Req, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CompanyRole } from '@prisma/client';
import { VerifySiweDto } from './dto/verify-siwe.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Get('company/:id')
  async getCompany(@Param('id') id: string) {
    return this.authService.getCompanyById(id);
  }
}
