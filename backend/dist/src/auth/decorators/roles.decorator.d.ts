import { CompanyRole } from '@prisma/client';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: CompanyRole[]) => import("@nestjs/common").CustomDecorator<string>;
