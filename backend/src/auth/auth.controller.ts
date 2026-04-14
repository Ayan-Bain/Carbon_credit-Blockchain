import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerifySiweDto } from './dto/verify-siwe.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('nonce')
  getNonce() {
    return { nonce: this.authService.generateNonce() };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Body() body: VerifySiweDto) {
    return this.authService.verifySiwe(body.message, body.signature);
  }
}
