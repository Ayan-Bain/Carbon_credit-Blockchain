import { AdminService } from './admin.service';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    updateRole(updateRoleDto: UpdateRoleDto): Promise<{
        message: string;
        txHash: any;
    }>;
}
