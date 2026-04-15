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
  @Roles(CompanyRole.REGULATOR, CompanyRole.ADMIN) // Allow both
  async updateRole(@Body() updateRoleDto: UpdateRoleDto) {
    return this.adminService.updateRole(updateRoleDto);
  }

  @Get('batches/pending')
  @Roles(CompanyRole.REGULATOR)
  async getPendingBatches() {
    return this.adminService.getPendingBatches();
  }

  @Post('batches/:id/verify')
  @Roles(CompanyRole.REGULATOR)
  async verifyBatch(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { quantity: number },
  ) {
    return this.adminService.verifyBatch(id, req.user.id, body.quantity);
  }

  @Post('batches/:id/reject')
  @Roles(CompanyRole.REGULATOR)
  async rejectBatch(@Req() req: any, @Param('id') id: string) {
    return this.adminService.rejectBatch(id, req.user.id);
  }
}
