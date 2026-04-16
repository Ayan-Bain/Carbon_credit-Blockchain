import { Controller, Post, Body, UseGuards, Get, Param, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CompanyRole } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('roles')
  @Roles(CompanyRole.ADMIN) // Restricted to ADMIN only
  async updateRole(@Body() updateRoleDto: UpdateRoleDto) {
    return this.adminService.updateRole(updateRoleDto);
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

  @Get('batches/pending')
  @Roles(CompanyRole.REGULATOR)
  async getPendingBatches() {
    return this.adminService.getPendingBatches();
  }

  @Post('batches/:id/approve')
  @Roles(CompanyRole.REGULATOR)
  async approveBatch(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { quantity?: number },
  ) {
    return this.adminService.approveBatch(id, req.user.id, body?.quantity);
  }

  @Post('batches/:id/reject')
  @Roles(CompanyRole.REGULATOR)
  async rejectBatch(@Req() req: any, @Param('id') id: string) {
    return this.adminService.rejectBatch(id, req.user.id);
  }
}
