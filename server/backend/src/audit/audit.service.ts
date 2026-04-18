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
  }

  async getCompanyHistory(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) return null;

    const history = await this.prisma.auditLog.findMany({
      where: {
        batch: {
          producerId: companyId
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        batch: true
      }
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
