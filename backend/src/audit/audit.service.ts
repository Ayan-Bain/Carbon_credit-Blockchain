import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async getBatchHistory(batchId: string) {
    return { batchId, history: [] };
  }

  async getCompanyHistory(companyId: string) {
    return { companyId, transactions: [] };
  }
}
