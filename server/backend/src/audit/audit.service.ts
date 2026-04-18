import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async getBatchHistory(batchId: string) {
    const batch = await this.prisma.creditBatch.findUnique({
      where: { id: batchId },
      include: {
        producer: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
          },
        },
        listings: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                walletAddress: true,
              },
            },
            transactions: {
              include: {
                buyer: {
                  select: {
                    id: true,
                    name: true,
                    walletAddress: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            listedAt: 'asc',
          },
        },
        retirements: {
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
                walletAddress: true,
              },
            },
          },
          orderBy: {
            retiredAt: 'asc',
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    const history = [
      {
        type: 'BATCH_SUBMITTED',
        at: batch.submittedAt,
        details: {
          status: batch.status,
          quantity: batch.quantity,
          remainingQuantity: batch.remainingQuantity,
          metadataIPFSHash: batch.metadataIPFSHash,
          onChainBatchId: batch.onChainBatchId,
          producer: batch.producer,
        },
      },
      ...(batch.verifiedAt
        ? [
            {
              type: batch.status === 'REJECTED' ? 'BATCH_REJECTED' : 'BATCH_VERIFIED',
              at: batch.verifiedAt,
              details: {
                status: batch.status,
                verifier: batch.verifiedBy,
                txHash: batch.txHash,
              },
            },
          ]
        : []),
      ...batch.listings.map((listing) => ({
        type: 'LISTING_CREATED',
        at: listing.listedAt,
        details: {
          listingId: listing.id,
          seller: listing.seller,
          pricePerUnit: Number(listing.pricePerUnit),
          availableUnits: listing.availableUnits,
        },
      })),
      ...batch.listings.flatMap((listing) =>
        listing.transactions.map((transaction) => ({
          type: 'LISTING_PURCHASED',
          at: transaction.createdAt,
          details: {
            listingId: listing.id,
            transactionId: transaction.id,
            buyer: transaction.buyer,
            unitsPurchased: transaction.unitsPurchased,
            totalPrice: Number(transaction.totalPrice),
            status: transaction.status,
            onChainTxHash: transaction.onChainTxHash,
          },
        })),
      ),
      ...batch.retirements.map((retirement) => ({
        type: 'CREDITS_RETIRED',
        at: retirement.retiredAt,
        details: {
          retirementId: retirement.id,
          buyer: retirement.buyer,
          unitsRetired: retirement.unitsRetired,
          purpose: retirement.purpose,
          onChainTxHash: retirement.onChainTxHash,
        },
      })),
    ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    return {
      batchId,
      batch: {
        id: batch.id,
        onChainBatchId: batch.onChainBatchId,
        status: batch.status,
        quantity: batch.quantity,
        remainingQuantity: batch.remainingQuantity,
        metadataIPFSHash: batch.metadataIPFSHash,
        submittedAt: batch.submittedAt,
        verifiedAt: batch.verifiedAt,
        txHash: batch.txHash,
        producer: batch.producer,
        verifiedBy: batch.verifiedBy,
      },
      history,
    };
  }

  async getCompanyHistory(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        walletAddress: true,
        role: true,
        kycVerified: true,
        createdAt: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const [producedBatches, verifiedBatches, listings, purchases, retirements] = await Promise.all([
      this.prisma.creditBatch.findMany({
        where: { producerId: companyId },
        orderBy: { submittedAt: 'asc' },
      }),
      this.prisma.creditBatch.findMany({
        where: { verifiedById: companyId },
        orderBy: { verifiedAt: 'asc' },
      }),
      this.prisma.creditListing.findMany({
        where: { sellerId: companyId },
        include: {
          batch: {
            select: {
              id: true,
              onChainBatchId: true,
            },
          },
        },
        orderBy: { listedAt: 'asc' },
      }),
      this.prisma.transaction.findMany({
        where: { buyerId: companyId },
        include: {
          listing: {
            include: {
              batch: {
                select: {
                  id: true,
                  onChainBatchId: true,
                },
              },
              seller: {
                select: {
                  id: true,
                  name: true,
                  walletAddress: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.retirementRecord.findMany({
        where: { buyerId: companyId },
        include: {
          batch: {
            include: {
              producer: {
                select: {
                  id: true,
                  name: true,
                  walletAddress: true,
                },
              },
            },
          },
        },
        orderBy: { retiredAt: 'asc' },
      }),
    ]);

    const history = [
      {
        type: 'COMPANY_CREATED',
        at: company.createdAt,
        details: {
          role: company.role,
          kycVerified: company.kycVerified,
        },
      },
      ...producedBatches.map((batch) => ({
        type: 'BATCH_SUBMITTED',
        at: batch.submittedAt,
        details: {
          batchId: batch.id,
          onChainBatchId: batch.onChainBatchId,
          status: batch.status,
          quantity: batch.quantity,
          remainingQuantity: batch.remainingQuantity,
        },
      })),
      ...verifiedBatches
        .filter((batch) => batch.verifiedAt)
        .map((batch) => ({
          type: batch.status === 'REJECTED' ? 'BATCH_REJECTED' : 'BATCH_VERIFIED',
          at: batch.verifiedAt as Date,
          details: {
            batchId: batch.id,
            onChainBatchId: batch.onChainBatchId,
            status: batch.status,
            quantity: batch.quantity,
            remainingQuantity: batch.remainingQuantity,
            txHash: batch.txHash,
          },
        })),
      ...listings.map((listing) => ({
        type: 'LISTING_CREATED',
        at: listing.listedAt,
        details: {
          listingId: listing.id,
          batchId: listing.batchId,
          onChainBatchId: listing.batch.onChainBatchId,
          pricePerUnit: Number(listing.pricePerUnit),
          availableUnits: listing.availableUnits,
        },
      })),
      ...purchases.map((transaction) => ({
        type: 'CREDITS_PURCHASED',
        at: transaction.createdAt,
        details: {
          transactionId: transaction.id,
          listingId: transaction.listingId,
          batchId: transaction.listing.batchId,
          onChainBatchId: transaction.listing.batch.onChainBatchId,
          seller: transaction.listing.seller,
          unitsPurchased: transaction.unitsPurchased,
          totalPrice: Number(transaction.totalPrice),
          status: transaction.status,
          onChainTxHash: transaction.onChainTxHash,
        },
      })),
      ...retirements.map((retirement) => ({
        type: 'CREDITS_RETIRED',
        at: retirement.retiredAt,
        details: {
          retirementId: retirement.id,
          batchId: retirement.batchId,
          onChainBatchId: retirement.batch.onChainBatchId,
          producer: (retirement.batch as any).producer,
          unitsRetired: retirement.unitsRetired,
          purpose: retirement.purpose,
          onChainTxHash: retirement.onChainTxHash,
        },
      })),
    ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    return {
      companyId,
      company,
      history,
    };
  }

  async getCompanyStats(companyId: string) {
    const [purchases, retirements] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { buyerId: companyId, status: 'CONFIRMED' },
        _sum: { unitsPurchased: true, totalPrice: true },
      }),
      this.prisma.retirementRecord.aggregate({
        where: { buyerId: companyId },
        _sum: { unitsRetired: true },
      }),
    ]);

    const totalPurchased = purchases._sum.unitsPurchased || 0;
    const totalRetired = retirements._sum.unitsRetired || 0;
    const currentHoldings = totalPurchased - totalRetired;
    const totalSpent = Number(purchases._sum.totalPrice || 0);

    return {
      totalCredits: currentHoldings,
      lifetimeOffset: totalRetired,
      portfolioValue: totalSpent, // Simplified, maybe current market value is better but this is a good start
      quarterlyGrowth: '+0%', // Placeholder
    };
  }

  async findActionByHash(hash: string) {
    const cleanHash = hash.trim();
    if (!cleanHash) throw new NotFoundException('Hash is required');

    // 1. Search in CreditBatches (Approval/Minting)
    const batchByHash = await this.prisma.creditBatch.findFirst({
      where: { txHash: cleanHash },
      select: { id: true, producerId: true },
    });
    if (batchByHash) {
      return { type: 'batch', id: batchByHash.id };
    }

    // 2. Search in Transactions (Purchase)
    const transactionByHash = await this.prisma.transaction.findFirst({
      where: { onChainTxHash: cleanHash },
      include: { listing: { select: { batchId: true } } },
    });
    if (transactionByHash) {
      return { type: 'batch', id: transactionByHash.listing.batchId };
    }

    // 3. Search in RetirementRecords (Retirement)
    const retirementByHash = await this.prisma.retirementRecord.findFirst({
      where: { onChainTxHash: cleanHash },
      select: { batchId: true },
    });
    if (retirementByHash) {
      return { type: 'batch', id: retirementByHash.batchId };
    }

    throw new NotFoundException('No records found matching this transaction hash.');
  }
}
