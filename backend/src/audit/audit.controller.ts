import { Controller, Get, Param } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('batch/:id')
  async getBatchLifecycle(@Param('id') id: string) {
    return this.auditService.getBatchHistory(id);
  }

  @Get('company/:id')
  async getCompanyHistory(@Param('id') id: string) {
    return this.auditService.getCompanyHistory(id);
  }
}
