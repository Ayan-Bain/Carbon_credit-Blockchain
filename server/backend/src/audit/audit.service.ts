import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BatchStatus, CompanyRole } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a deterministic hash for a set of data.
   */
  calculateDataHash(data: any): string {
    const sortedData = this.sortKeys(data);
    return crypto.createHash('sha256').update(JSON.stringify(sortedData)).digest('hex');
  }

  /**
   * Logs a transition in the batch lifecycle and links it to the previous state.
   */
  async logTransition(batchId: string, action: string, payload: any, txHash?: string) {
    // 1. Get the most recent audit log for this batch to find the prevHash
    const lastLog = await this.prisma.auditLog.findFirst({
      where: { batchId },
      orderBy: { createdAt: 'desc' },
    });

    const currHash = this.calculateDataHash({
        prevHash: lastLog?.currHash || null,
        action,
        payload,
        txHash: txHash || null
    });

    const log = await this.prisma.auditLog.create({
      data: {
        batchId,
        action,
        prevHash: lastLog?.currHash || null,
        currHash,
        payload,
        txHash,
      },
    });

    this.logger.log(`Audit Log created for batch ${batchId}: ${action} (Hash: ${currHash.slice(0, 8)}...)`);
    return log;
  }

  /**
   * Verifies the entire audit chain for a specific batch.
   */
  async verifyChain(batchId: string): Promise<boolean> {
    const logs = await this.prisma.auditLog.findMany({
      where: { batchId },
      orderBy: { createdAt: 'asc' },
    });

    let expectedPrevHash: string | null = null;

    for (const log of logs) {
      if (log.prevHash !== expectedPrevHash) {
        this.logger.error(`CHAIN BREAK DETECTED for batch ${batchId} at log ${log.id}`);
        return false;
      }

      const calculatedHash = this.calculateDataHash({
        prevHash: log.prevHash,
        action: log.action,
        payload: log.payload,
        txHash: log.txHash
      });

      if (log.currHash !== calculatedHash) {
        this.logger.error(`HASH MISMATCH DETECTED for batch ${batchId} at log ${log.id}`);
        return false;
      }

      expectedPrevHash = log.currHash;
    }

    return true;
  }

  async getBatchHistory(batchId: string) {
    return this.prisma.auditLog.findMany({
      where: { batchId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActionByHash(txHash: string) {
    return this.prisma.auditLog.findFirst({
      where: { txHash },
    });
  }

  async getCompanyStats(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { role: true }
    });

    if (company?.role === CompanyRole.PRODUCER) {
      const batches = await this.prisma.creditBatch.findMany({
        where: { producerId: companyId },
      });

      return {
        totalBatches: batches.length,
        totalCredits: batches.reduce((acc, b) => acc + b.quantity, 0),
        verifiedCredits: batches
          .filter(b => b.status === BatchStatus.VERIFIED)
          .reduce((acc, b) => acc + b.quantity, 0),
      };
    } else {
      // Buyer/Minter/Admin Statistics
      const [purchased, retired] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: { buyerId: companyId, status: 'CONFIRMED' },
          _sum: { unitsPurchased: true }
        }),
        this.prisma.retirementRecord.aggregate({
          where: { buyerId: companyId },
          _sum: { unitsRetired: true }
        })
      ]);

      const unitsPurchased = purchased._sum.unitsPurchased || 0;
      const unitsRetired = retired._sum.unitsRetired || 0;
      const activeBalance = unitsPurchased - unitsRetired;

      return {
        totalCredits: activeBalance,
        lifetimeOffset: unitsRetired,
        portfolioValue: activeBalance * 27.53, // Match BuyerDashboard's exchange rate
        quarterlyGrowth: "+12.4%" // Mocked for demonstration
      };
    }
  }

  async getCompanyHistory(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) return null;

    const logs = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { batch: { producerId: companyId } },
          { batch: { retirements: { some: { buyerId: companyId } } } },
          { batch: { listings: { some: { transactions: { some: { buyerId: companyId, status: 'CONFIRMED' } } } } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        batch: {
          include: {
            producer: true
          }
        }
      }
    });

    // Apply privacy filtering
    const history = logs.filter(log => {
        const payload = log.payload as any;
        // 1. If you are the producer of the batch, you can see all lifecycle events
        if (log.batch.producerId === companyId) return true;

        // 2. Publicly verifiable events for anyone who owns part of the batch
        if (['SUBMISSION', 'APPROVAL', 'MINTING', 'SECURITY_LOCK'].includes(log.action)) return true;

        // 3. Private events (SALE, RETIREMENT) only visible to involved parties
        return payload.buyerId === companyId || payload.sellerId === companyId;
    });

    return { company, history };
  }

  private sortKeys(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(this.sortKeys);
    
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = this.sortKeys(obj[key]);
        return acc;
      }, {});
  }
}
