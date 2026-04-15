import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class AdminService {
    private readonly prisma;
    private readonly blockchain;
    constructor(prisma: PrismaService, blockchain: BlockchainService);
    updateRole(updateRoleDto: UpdateRoleDto): Promise<{
        message: string;
        txHash: any;
    }>;
}
