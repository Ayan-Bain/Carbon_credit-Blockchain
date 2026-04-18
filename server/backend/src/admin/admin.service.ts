import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { BatchStatus } from '@prisma/client';

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
      where: { status: BatchStatus.PENDING },
    });
  }

  async approveBatch(batchId: string, regulatorId: string, quantity?: number) {
    const batch = await this.prisma.creditBatch.findUnique({
      where: { id: batchId },
    });
    if (!batch) throw new NotFoundException('Batch not found');
    if (batch.status !== 'PENDING') throw new BadRequestException('Batch is not in PENDING status');

    const finalQuantity = quantity || batch.quantity;

    return this.prisma.creditBatch.update({
      where: { id: batchId },
      data: {
        status: BatchStatus.APPROVED,
        verifiedAt: new Date(),
        verifiedById: regulatorId,
        quantity: finalQuantity,
        remainingQuantity: finalQuantity,
      },
    });
  }

  async rejectBatch(batchId: string, regulatorId: string) {
    return this.prisma.creditBatch.update({
      where: { id: batchId },
      data: {
        status: BatchStatus.REJECTED,
        verifiedAt: new Date(),
        verifiedById: regulatorId,
      },
    });
  }

  async verifyCompany(id: string, verified: boolean) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');

    return this.prisma.company.update({
      where: { id },
      data: { kycVerified: verified },
    });
  }

  async getRegulatorStats(regulatorId: string) {
    const verifiedStatuses = [BatchStatus.APPROVED, BatchStatus.MINTED, BatchStatus.LISTED];
    
    const [verifiedCount, rejectedCount, batches] = await Promise.all([
      this.prisma.creditBatch.count({
        where: {
          verifiedById: regulatorId,
          status: { in: verifiedStatuses },
        },
      }),
      this.prisma.creditBatch.count({
        where: {
          verifiedById: regulatorId,
          status: BatchStatus.REJECTED,
        },
      }),
      this.prisma.creditBatch.findMany({
        where: {
          verifiedById: regulatorId,
        },
        include: {
          producer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          verifiedAt: 'desc',
        },
      }),
    ]);

    return {
      lifetimeVerified: verifiedCount,
      lifetimeRejected: rejectedCount,
      totalAudited: verifiedCount + rejectedCount,
      history: batches,
    };
  }

  async getAllCompanies() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGlobalStats() {
    const [minted, retired, transactions] = await Promise.all([
      this.prisma.creditBatch.aggregate({
        where: { status: { in: [BatchStatus.MINTED, BatchStatus.LISTED, BatchStatus.SOLD_OUT] } },
        _sum: { quantity: true },
      }),
      this.prisma.retirementRecord.aggregate({
        _sum: { unitsRetired: true },
      }),
      this.prisma.transaction.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { unitsPurchased: true, totalPrice: true },
      }),
    ]);

    return {
      totalMinted: minted._sum.quantity || 0,
      totalRetired: retired._sum.unitsRetired || 0,
      totalVolume: transactions._sum.unitsPurchased || 0,
      totalValue: Number(transactions._sum.totalPrice || 0),
    };
  }

  async getApprovedBatches() {
    return this.prisma.creditBatch.findMany({
      where: {
        status: BatchStatus.APPROVED,
        onChainBatchId: null, // Ensuring it hasn't been minted yet
      },
      include: {
        producer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        verifiedAt: 'asc',
      },
    });
  }
}
