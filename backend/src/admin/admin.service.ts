import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
  ) {}

  async updateRole(updateRoleDto: UpdateRoleDto) {
    const { walletAddress, role, grant } = updateRoleDto;

    // 1. Update in Database
    const company = await this.prisma.company.findUnique({
      where: { walletAddress },
    });

    if (!company) {
      throw new NotFoundException(`Company with wallet ${walletAddress} not found`);
    }

    // Update role in DB (if granting, set to the role; if revoking, we might want to default to BUYER or something else, 
    // but here we just update the specific role field)
    await this.prisma.company.update({
      where: { walletAddress },
      data: { role: grant ? role : 'BUYER' }, // Defaulting to BUYER if revoked
    });

    // 2. Update on Blockchain
    const txHash = await this.blockchain.setOnChainRole(walletAddress, role, grant);

    return {
      message: `Role ${role} ${grant ? 'granted to' : 'revoked from'} ${walletAddress}`,
      txHash,
    };
  }

  async getPendingBatches() {
    return this.prisma.creditBatch.findMany({
      where: { status: 'PENDING' },
    });
  }

  async verifyBatch(batchId: string, regulatorId: string, quantity: number) {
    const batch = await this.prisma.creditBatch.findUnique({
      where: { id: batchId },
    });
    if (!batch) throw new NotFoundException('Batch not found');

    const txHash = await this.blockchain.verifyBatch(batch.onChainBatchId, quantity);

    return this.prisma.creditBatch.update({
      where: { id: batchId },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedById: regulatorId,
        txHash: txHash,
        quantity: quantity,
        remainingQuantity: quantity,
      },
    });
  }

  async rejectBatch(batchId: string, regulatorId: string) {
    return this.prisma.creditBatch.update({
      where: { id: batchId },
      data: {
        status: 'REJECTED',
        verifiedAt: new Date(),
        verifiedById: regulatorId,
      },
    });
  }
}
