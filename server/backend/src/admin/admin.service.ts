import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { IntegrityService, Mismatch } from '../integrity/integrity.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { BatchStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
    private readonly integrityService: IntegrityService,
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
      data: { role: (grant ? role : 'BUYER') as any }, // Cast to any to bypass enum validation
    });

    // 2. Update on Blockchain
    const txHash = await this.blockchainService.setOnChainRole(walletAddress, role, grant);

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
      include: { producer: true },
    });
    if (!batch) throw new NotFoundException('Batch not found');
    if (batch.status !== 'PENDING') throw new BadRequestException('Batch is not in PENDING status');

    const finalQuantity = quantity || batch.quantity;

    // Step 2: Record Approval on the Blockchain (Immediate Integrity Lock)
    const { txHash, onChainBatchId } = await this.blockchainService.recordApproval(
      (batch as any).producer.walletAddress,
      batch.metadataIPFSHash,
      finalQuantity
    );

    return this.prisma.creditBatch.update({
      where: { id: batchId },
      data: {
        status: BatchStatus.APPROVED,
        verifiedAt: new Date(),
        verifiedBy: { connect: { id: regulatorId } },
        onChainBatchId, // Store the locked ID immediately
        quantity: finalQuantity,
        remainingQuantity: finalQuantity,
        txHash, // Hash of the approval transaction
        verificationHash: this.blockchainService.getMintingHash(
            (batch as any).producer.walletAddress,
            batch.metadataIPFSHash,
            finalQuantity
        )
      } as any,
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
    const verifiedStatuses = [BatchStatus.APPROVED, BatchStatus.VERIFIED, BatchStatus.LISTED];
    
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
    try {
      const [minted, retired, transactions, onChain, integrityCheck] = await Promise.all([
        this.prisma.creditBatch.aggregate({
          where: {
            onChainBatchId: { not: null } // Use onChainBatchId to identify minted batches
          },
          _sum: { quantity: true },
        }),
        this.prisma.retirementRecord.aggregate({
          _sum: { unitsRetired: true },
        }),
        this.prisma.transaction.aggregate({
          where: { status: 'CONFIRMED' as any },
          _sum: { unitsPurchased: true, totalPrice: true },
        }),
        this.blockchainService.getOnChainTotals(),
        this.integrityService.performIntegrityCheck(),
      ]);

      const dbRetired = retired?._sum?.unitsRetired || 0;
      const ledgerRetired = onChain.totalRetired;
      const hasMismatch = dbRetired !== ledgerRetired || integrityCheck.length > 0;

      if (hasMismatch) {
        console.warn(`SECURITY ALERT: Integrity issues detected! Retirement mismatch: DB=${dbRetired}, Ledger=${ledgerRetired}. Additional mismatches: ${integrityCheck.length}`);
      }

      // Group mismatches by severity
      const criticalMismatches = integrityCheck.filter(m => m.severity === 'CRITICAL');
      const highMismatches = integrityCheck.filter(m => m.severity === 'HIGH');

      return {
        totalMinted: minted?._sum?.quantity || 0,
        totalRetired: ledgerRetired, // Blockchain is the absolute truth
        totalVolume: transactions?._sum?.unitsPurchased || 0,
        totalValue: Number(transactions?._sum?.totalPrice || 0),
        securityMismatch: hasMismatch,
        integrityIssues: {
          total: integrityCheck.length,
          critical: criticalMismatches.length,
          high: highMismatches.length,
          details: integrityCheck.slice(0, 10), // Show first 10 mismatches
        },
      };
    } catch (err) {
      console.error('Failed to aggregate global stats:', err);
      return {
        totalMinted: 0,
        totalRetired: 0,
        totalVolume: 0,
        totalValue: 0,
        securityMismatch: false,
        integrityIssues: {
          total: 0,
          critical: 0,
          high: 0,
          details: [],
        },
      };
    }
  }

  async getApprovedBatches() {
    return this.prisma.creditBatch.findMany({
      where: {
        status: BatchStatus.APPROVED,
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
