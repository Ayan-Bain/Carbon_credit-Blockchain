import { 
  Controller, 
  Post, 
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
import { VerifyBatchDto } from './dto/verify-batch.dto';

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

  @Post('admin/batches/:id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CompanyRole.REGULATOR)
  async verifyBatch(
    @Req() req: any,
    @Param('id') id: string,
    @Body() verifyDto: VerifyBatchDto,
  ) {
    return this.creditsService.verifyBatch(id, req.user.id, verifyDto.quantity);
  }
}
