import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('batch/:id')
  async getBatchLifecycle(@Param('id') id: string) {
    return this.auditService.getBatchHistory(id);
  }

  @Get('company/stats')
  @UseGuards(JwtAuthGuard)
  async getMyStats(@Req() req: any) {
    return this.auditService.getCompanyStats(req.user.id);
  }

  @Get('company/me')
  @UseGuards(JwtAuthGuard)
  async getMyHistory(@Req() req: any) {
    return this.auditService.getCompanyHistory(req.user.id);
  }

  @Get('company/:id')
  async getCompanyHistory(@Param('id') id: string) {
    return this.auditService.getCompanyHistory(id);
  }

  @Get('tx/:hash')
  async findByHash(@Param('hash') hash: string) {
    return this.auditService.findActionByHash(hash);
  }
}
