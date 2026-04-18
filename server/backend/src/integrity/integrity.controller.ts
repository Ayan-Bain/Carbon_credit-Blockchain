import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { IntegrityService, Mismatch } from './integrity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('integrity')
@UseGuards(JwtAuthGuard)
export class IntegrityController {
  constructor(private readonly integrityService: IntegrityService) {}

  @Get('check')
  async performIntegrityCheck(): Promise<Mismatch[]> {
    return this.integrityService.performIntegrityCheck();
  }

  @Get('mismatches')
  async getCurrentMismatches(): Promise<Mismatch[]> {
    return this.integrityService.getCurrentMismatches();
  }

  @Post('revert/:mismatchId')
  async revertMismatch(
    @Param('mismatchId') mismatchId: string,
    @Req() req: any,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const success = await this.integrityService.revertMismatch(mismatchId, req.user.id);
      return {
        success,
        message: success ? 'Mismatch reverted successfully' : 'Revert not implemented for this mismatch type',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to revert mismatch: ${error.message}`,
      };
    }
  }
}