import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BatchStatus } from '@prisma/client';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class MarketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
  ) {}

  async createListing(batchId: string, price: number, amount: number, producerId: string) {
    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      throw new BadRequestException('price must be a positive number');
    }

    if (!amount || !Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('amount must be a positive integer');
    }

    const batch = await this.prisma.creditBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (batch.producerId !== producerId) {
      throw new BadRequestException('You do not own this batch');
    }

    if (batch.status !== BatchStatus.VERIFIED && batch.status !== BatchStatus.LISTED) {
      throw new BadRequestException('Only verified batches can be listed');
    }

    if (batch.remainingQuantity < amount) {
      throw new BadRequestException('Not enough available credits in this batch');
    }

    const listing = await this.prisma.$transaction(async (tx) => {
      const createdListing = await tx.creditListing.create({
        data: {
          batchId,
          sellerId: producerId,
          pricePerUnit: numericPrice,
          availableUnits: amount,
        },
        include: {
          batch: true,
          seller: {
            select: {
              id: true,
              name: true,
              walletAddress: true,
            },
          },
        },
      });

      await tx.creditBatch.update({
        where: { id: batchId },
        data: {
          remainingQuantity: {
            decrement: amount,
          },
          status: BatchStatus.LISTED,
        },
      });

      return createdListing;
    });

    return this.serializeListing(listing);
  }

  async getListings() {
    const listings = await this.prisma.creditListing.findMany({
      where: {
        availableUnits: {
          gt: 0,
        },
      },
      include: {
        batch: true,
        seller: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
          },
        },
      },
      orderBy: {
        listedAt: 'desc',
      },
    });

    return listings.map((listing) => this.serializeListing(listing));
  }

  async buyListing(listingId: string, amount: number, buyerId: string) {
    if (!amount || !Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('amount must be a positive integer');
    }

    const listing = await this.prisma.creditListing.findUnique({
      where: { id: listingId },
      include: {
        batch: true,
        seller: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.availableUnits < amount) {
      throw new BadRequestException('Not enough credits available in this listing');
    }

    const buyer = await this.prisma.company.findUnique({
      where: { id: buyerId },
    });

    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }

    if (!listing.batch.onChainBatchId) {
      throw new BadRequestException('Batch has not been confirmed on-chain');
    }

    const txHash = await this.blockchain.transferCredits(
      listing.batch.onChainBatchId,
      listing.seller.walletAddress,
      buyer.walletAddress,
      amount,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          listingId,
          buyerId,
          unitsPurchased: amount,
          totalPrice: Number(listing.pricePerUnit) * amount,
          onChainTxHash: txHash,
          status: 'CONFIRMED',
        },
      });

      const updatedListing = await tx.creditListing.update({
        where: { id: listingId },
        data: {
          availableUnits: {
            decrement: amount,
          },
        },
      });

      if (updatedListing.availableUnits === 0 && listing.batch.remainingQuantity === 0) {
        await tx.creditBatch.update({
          where: { id: listing.batchId },
          data: {
            status: BatchStatus.SOLD_OUT,
          },
        });
      }

      return transaction;
    });

    return {
      status: 'Purchase successful',
      transactionId: updated.id,
      listingId,
      amount,
      txHash,
    };
  }

  private serializeListing(listing: any) {
    return {
      ...listing,
      pricePerUnit: Number(listing.pricePerUnit),
    };
  }
}
