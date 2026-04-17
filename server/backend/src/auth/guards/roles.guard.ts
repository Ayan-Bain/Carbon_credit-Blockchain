import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CompanyRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<CompanyRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Bypass for Default Admin Address (useful for bootstrap/initial setup)
    const adminAddress = process.env.ADMIN_WALLET_ADDRESS;
    if (adminAddress && user?.walletAddress?.toLowerCase() === adminAddress.toLowerCase()) {
      return true;
    }

    return requiredRoles.includes(user?.role);
  }
}
