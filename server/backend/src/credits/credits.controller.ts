import { 
  Controller, 
  Post, 
  Get,
  Body, 
  Param, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile, 
  Req,
  Res
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreditsService } from './credits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CompanyRole } from '@prisma/client';

@Controller()
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post('credits/batches')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CompanyRole.PRODUCER)
  @UseInterceptors(FileInterceptor('file'))
  async submitBatch(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: any,
  ) {
    return this.creditsService.submitBatch(req.user.id, file, metadata);
  }

  @Post('credits/batches/:id/mint')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CompanyRole.MINTER)
  async mintBatch(
    @Param('id') id: string,
  ) {
    return this.creditsService.mintBatch(id);
  }

  @Get('credits/batches')
  @UseGuards(JwtAuthGuard)
  async getOwnBatches(@Req() req: any) {
    return this.creditsService.getProducerBatches(req.user.id);
  }

  @Get('credits/batches/:id')
  async getBatchDetails(@Param('id') id: string) {
    return this.creditsService.getBatch(id);
  }

  @Get('credits/batches/:id/metadata')
  async getBatchMetadata(@Param('id') id: string) {
    return this.creditsService.getBatchMetadata(id);
  }

  @Get('credits/batches/:id/download')
  async downloadBatchFile(@Param('id') id: string, @Res() res: Response) {
    const { data, contentType } = await this.creditsService.getBatchAsset(id);
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="proof_${id}"`,
    });
    res.send(data);
  }

  @Post('credits/retire')
  @UseGuards(JwtAuthGuard)
  async retireCredits(@Req() req: any, @Body() body: { batchId: string; amount: number; purpose?: string }) {
    return this.creditsService.retireCredits(body.batchId, body.amount, req.user.id, body.purpose);
  }

  @Get('credits/portfolio')
  @UseGuards(JwtAuthGuard)
  async getPortfolio(@Req() req: any) {
    return this.creditsService.getBuyerPortfolio(req.user.id);
  }

  @Post('credits/batches/:id/invalidate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CompanyRole.REGULATOR, CompanyRole.ADMIN)
  async manualInvalidate(@Param('id') id: string) {
    return this.creditsService.manualInvalidate(id);
  }
}
