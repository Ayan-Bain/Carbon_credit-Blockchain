import { 
  Controller, 
  Post, 
  Get,
  Body, 
  Param, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile, 
  Req 
} from '@nestjs/common';
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

  @Post('credits/retire')
  @UseGuards(JwtAuthGuard)
  async retireCredits(@Req() req: any, @Body() body: { batchId: string; amount: number; purpose?: string }) {
    return this.creditsService.retireCredits(body.batchId, body.amount, req.user.id, body.purpose);
  }
}
