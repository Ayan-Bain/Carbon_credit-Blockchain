import { Controller, Post, Body, UseGuards, Get, Param, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { IntegrityService } from '../integrity/integrity.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CompanyRole } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly integrityService: IntegrityService,
  ) {}

  @Post('roles/update')
  @Roles(CompanyRole.ADMIN)
  async updateRole(@Body() updateRoleDto: UpdateRoleDto) {
    return this.adminService.updateRole(updateRoleDto);
  }

  @Get('stats/global')
  @Roles(CompanyRole.ADMIN)
  async getGlobalStats() {
    return this.adminService.getGlobalStats();
  }

  @Post('companies/:id/verify')
  @Roles(CompanyRole.ADMIN)
  async verifyCompany(@Param('id') id: string, @Body('verified') verified: boolean) {
    return this.adminService.verifyCompany(id, verified);
  }

  @Get('companies')
  @Roles(CompanyRole.ADMIN)
  async getAllCompanies() {
    return this.adminService.getAllCompanies();
  }

  @Post('promote-regulator')
  @Roles(CompanyRole.ADMIN) // Restricted to ADMIN only
  async promoteToRegulator(@Body('walletAddress') walletAddress: string) {
    return this.adminService.updateRole({
      walletAddress,
      role: CompanyRole.REGULATOR,
      grant: true,
    });
  }

  @Get('integrity/check')
  @Roles(CompanyRole.ADMIN)
  async performIntegrityCheck() {
    return this.integrityService.performIntegrityCheck();
  }

  @Get('integrity/mismatches')
  @Roles(CompanyRole.ADMIN)
  async getIntegrityMismatches() {
    return this.integrityService.getCurrentMismatches();
  }

  @Post('integrity/revert/:mismatchId')
  @Roles(CompanyRole.ADMIN)
  async revertMismatch(@Param('mismatchId') mismatchId: string, @Req() req: any) {
    const success = await this.integrityService.revertMismatch(mismatchId, req.user.id);
    return {
      success,
      message: success ? 'Mismatch reverted successfully' : 'Revert operation not supported for this mismatch type',
    };
  }

  @Get('batches/pending')
  @Roles(CompanyRole.REGULATOR, CompanyRole.ADMIN)
  async getPendingBatches() {
    return this.adminService.getPendingBatches();
  }

  @Post('batches/:id/approve')
  @Roles(CompanyRole.REGULATOR, CompanyRole.ADMIN)
  async approveBatch(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { quantity?: number },
  ) {
    return this.adminService.approveBatch(id, req.user.id, body?.quantity);
  }

  @Post('batches/:id/reject')
  @Roles(CompanyRole.REGULATOR, CompanyRole.ADMIN)
  async rejectBatch(@Req() req: any, @Param('id') id: string) {
    return this.adminService.rejectBatch(id, req.user.id);
  }

  @Get('regulator/stats')
  @Roles(CompanyRole.REGULATOR, CompanyRole.ADMIN)
  async getRegulatorStats(@Req() req: any) {
    return this.adminService.getRegulatorStats(req.user.id);
  }

  @Get('batches/approved')
  @Roles(CompanyRole.MINTER, CompanyRole.ADMIN)
  async getApprovedBatches() {
    return this.adminService.getApprovedBatches();
  }
}
