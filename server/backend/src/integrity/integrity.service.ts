import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';

export interface Mismatch {
  id: string;
  type: 'BATCH_QUANTITY' | 'LISTING_QUANTITY' | 'BATCH_STATUS' | 'TRANSACTION_STATUS' | 'RETIREMENT_AMOUNT' | 'MISSING_ONCHAIN';
  entityId: string;
  entityType: 'CreditBatch' | 'CreditListing' | 'Transaction' | 'RetirementRecord';
  dbValue: any;
  blockchainValue: any;
  detectedAt: Date;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

@Injectable()
export class IntegrityService {
  private readonly logger = new Logger(IntegrityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
  ) {}

  /**
   * Comprehensive integrity check between database and blockchain
   */
  async performIntegrityCheck(): Promise<Mismatch[]> {
    const mismatches: Mismatch[] = [];

    try {
      // Check batches
      const batchMismatches = await this.checkBatchIntegrity();
      mismatches.push(...batchMismatches);

      // Check listings
      const listingMismatches = await this.checkListingIntegrity();
      mismatches.push(...listingMismatches);

      // Check transactions
      const transactionMismatches = await this.checkTransactionIntegrity();
      mismatches.push(...transactionMismatches);

      // Check retirements
      const retirementMismatches = await this.checkRetirementIntegrity();
      mismatches.push(...retirementMismatches);

      // Check for orphaned records
      const orphanedMismatches = await this.checkOrphanedRecords();
      mismatches.push(...orphanedMismatches);

      this.logger.log(`Integrity check completed. Found ${mismatches.length} mismatches`);

      // Store mismatches for admin review
      await this.storeMismatches(mismatches);

      return mismatches;
    } catch (error) {
      this.logger.error('Integrity check failed:', error);
      return [];
    }
  }

  private async checkBatchIntegrity(): Promise<Mismatch[]> {
    const mismatches: Mismatch[] = [];

    // Get all batches with onChainBatchId
    const batches = await this.prisma.creditBatch.findMany({
      where: { onChainBatchId: { not: null } },
    });

    for (const batch of batches) {
      try {
        // For now, we can only check if the batch exists on-chain
        // In a more advanced system, we could check quantities and statuses
        // But that would require additional contract methods

        // Check if batch should have been verified but isn't
        if (batch.status === 'VERIFIED' && !batch.onChainBatchId) {
          mismatches.push({
            id: `batch-${batch.id}`,
            type: 'MISSING_ONCHAIN',
            entityId: batch.id,
            entityType: 'CreditBatch',
            dbValue: batch.status,
            blockchainValue: null,
            detectedAt: new Date(),
            description: `Batch ${batch.id} is marked as VERIFIED in DB but has no onChainBatchId`,
            severity: 'HIGH',
          });
        }

        // Check for suspicious quantity changes
        // This is a basic check - in reality, you'd need to track historical changes
        if (batch.quantity < 0) {
          mismatches.push({
            id: `batch-quantity-${batch.id}`,
            type: 'BATCH_QUANTITY',
            entityId: batch.id,
            entityType: 'CreditBatch',
            dbValue: batch.quantity,
            blockchainValue: 'unknown',
            detectedAt: new Date(),
            description: `Batch ${batch.id} has negative quantity: ${batch.quantity}`,
            severity: 'CRITICAL',
          });
        }

      } catch (error) {
        this.logger.warn(`Failed to check batch ${batch.id}:`, error);
      }
    }

    return mismatches;
  }

  private async checkListingIntegrity(): Promise<Mismatch[]> {
    const mismatches: Mismatch[] = [];

    // Get all listings
    const listings = await this.prisma.creditListing.findMany({
      include: { batch: true },
    });

    for (const listing of listings) {
      // Check for invalid quantities
      if (listing.availableUnits < 0) {
        mismatches.push({
          id: `listing-quantity-${listing.id}`,
          type: 'LISTING_QUANTITY',
          entityId: listing.id,
          entityType: 'CreditListing',
          dbValue: listing.availableUnits,
          blockchainValue: 0,
          detectedAt: new Date(),
          description: `Listing ${listing.id} has negative available units: ${listing.availableUnits}`,
          severity: 'HIGH',
        });
      }

      // Check if listing quantity exceeds batch remaining quantity
      if (listing.availableUnits > listing.batch.remainingQuantity) {
        mismatches.push({
          id: `listing-exceeds-batch-${listing.id}`,
          type: 'LISTING_QUANTITY',
          entityId: listing.id,
          entityType: 'CreditListing',
          dbValue: listing.availableUnits,
          blockchainValue: listing.batch.remainingQuantity,
          detectedAt: new Date(),
          description: `Listing ${listing.id} has ${listing.availableUnits} units but batch only has ${listing.batch.remainingQuantity} remaining`,
          severity: 'HIGH',
        });
      }

      // Check for invalid prices
      if (listing.pricePerUnit.lte(0)) {
        mismatches.push({
          id: `listing-price-${listing.id}`,
          type: 'LISTING_QUANTITY',
          entityId: listing.id,
          entityType: 'CreditListing',
          dbValue: listing.pricePerUnit,
          blockchainValue: 'unknown',
          detectedAt: new Date(),
          description: `Listing ${listing.id} has invalid price: ${listing.pricePerUnit}`,
          severity: 'MEDIUM',
        });
      }
    }

    return mismatches;
  }

  private async checkTransactionIntegrity(): Promise<Mismatch[]> {
    const mismatches: Mismatch[] = [];

    const transactions = await this.prisma.transaction.findMany({
      where: { status: 'CONFIRMED' },
      include: { listing: { include: { batch: true } } },
    });

    for (const transaction of transactions) {
      // Check if transaction has on-chain hash but shouldn't
      if (!transaction.onChainTxHash && transaction.status === 'CONFIRMED') {
        mismatches.push({
          id: `transaction-${transaction.id}`,
          type: 'TRANSACTION_STATUS',
          entityId: transaction.id,
          entityType: 'Transaction',
          dbValue: transaction.status,
          blockchainValue: null,
          detectedAt: new Date(),
          description: `Transaction ${transaction.id} is CONFIRMED but has no onChainTxHash`,
          severity: 'MEDIUM',
        });
      }

      // Check for suspicious amounts
      if (transaction.unitsPurchased <= 0 || transaction.totalPrice.lte(0)) {
        mismatches.push({
          id: `transaction-amount-${transaction.id}`,
          type: 'TRANSACTION_STATUS',
          entityId: transaction.id,
          entityType: 'Transaction',
          dbValue: { units: transaction.unitsPurchased, price: transaction.totalPrice },
          blockchainValue: 'unknown',
          detectedAt: new Date(),
          description: `Transaction ${transaction.id} has invalid amounts: ${transaction.unitsPurchased} units, $${transaction.totalPrice}`,
          severity: 'HIGH',
        });
      }
    }

    return mismatches;
  }

  private async checkRetirementIntegrity(): Promise<Mismatch[]> {
    const mismatches: Mismatch[] = [];

    // Compare total retired in DB vs blockchain
    const dbRetiredResult = await this.prisma.retirementRecord.aggregate({
      _sum: { unitsRetired: true },
    });
    const dbRetired = dbRetiredResult._sum.unitsRetired || 0;

    const onChainTotals = await this.blockchain.getOnChainTotals();
    const blockchainRetired = onChainTotals.totalRetired;

    if (dbRetired !== blockchainRetired) {
      mismatches.push({
        id: 'retirement-total-mismatch',
        type: 'RETIREMENT_AMOUNT',
        entityId: 'global',
        entityType: 'RetirementRecord',
        dbValue: dbRetired,
        blockchainValue: blockchainRetired,
        detectedAt: new Date(),
        description: `Total retired units mismatch: DB=${dbRetired}, Blockchain=${blockchainRetired}`,
        severity: 'CRITICAL',
      });
    }

    // Check individual retirements
    const retirements = await this.prisma.retirementRecord.findMany();
    for (const retirement of retirements) {
      if (!retirement.onChainTxHash) {
        mismatches.push({
          id: `retirement-${retirement.id}`,
          type: 'RETIREMENT_AMOUNT',
          entityId: retirement.id,
          entityType: 'RetirementRecord',
          dbValue: retirement.unitsRetired,
          blockchainValue: null,
          detectedAt: new Date(),
          description: `Retirement ${retirement.id} has no onChainTxHash`,
          severity: 'HIGH',
        });
      }

      if (retirement.unitsRetired <= 0) {
        mismatches.push({
          id: `retirement-amount-${retirement.id}`,
          type: 'RETIREMENT_AMOUNT',
          entityId: retirement.id,
          entityType: 'RetirementRecord',
          dbValue: retirement.unitsRetired,
          blockchainValue: 'unknown',
          detectedAt: new Date(),
          description: `Retirement ${retirement.id} has invalid amount: ${retirement.unitsRetired}`,
          severity: 'HIGH',
        });
      }
    }

    return mismatches;
  }

  private async checkOrphanedRecords(): Promise<Mismatch[]> {
    const mismatches: Mismatch[] = [];

    // Find transactions without valid listings
    const orphanedTransactions = await this.prisma.transaction.findMany({
      where: {
        listing: { is: null } as any,
      },
    });

    for (const transaction of orphanedTransactions) {
      mismatches.push({
        id: `orphaned-transaction-${transaction.id}`,
        type: 'MISSING_ONCHAIN',
        entityId: transaction.id,
        entityType: 'Transaction',
        dbValue: transaction.listingId,
        blockchainValue: null,
        detectedAt: new Date(),
        description: `Transaction ${transaction.id} references non-existent listing ${transaction.listingId}`,
        severity: 'HIGH',
      });
    }

    // Find retirements without valid batches
    const orphanedRetirements = await this.prisma.retirementRecord.findMany({
      where: {
        batch: { is: null } as any,
      },
    });

    for (const retirement of orphanedRetirements) {
      mismatches.push({
        id: `orphaned-retirement-${retirement.id}`,
        type: 'MISSING_ONCHAIN',
        entityId: retirement.id,
        entityType: 'RetirementRecord',
        dbValue: retirement.batchId,
        blockchainValue: null,
        detectedAt: new Date(),
        description: `Retirement ${retirement.id} references non-existent batch ${retirement.batchId}`,
        severity: 'HIGH',
      });
    }

    return mismatches;
  }

  private async storeMismatches(mismatches: Mismatch[]): Promise<void> {
    // In a real implementation, you'd create a Mismatch table
    // For now, we'll just log them
    for (const mismatch of mismatches) {
      this.logger.warn(`INTEGRITY MISMATCH: ${mismatch.description} (Severity: ${mismatch.severity})`);
    }
  }

  /**
   * Get current mismatches for admin review
   */
  async getCurrentMismatches(): Promise<Mismatch[]> {
    // In a real implementation, this would query a Mismatch table
    // For now, run a fresh check
    return await this.performIntegrityCheck();
  }

  /**
   * Attempt to revert a mismatch by updating DB to match blockchain
   */
  async revertMismatch(mismatchId: string, adminId: string): Promise<boolean> {
    this.logger.log(`Admin ${adminId} attempting to revert mismatch ${mismatchId}`);

    // Get current mismatches to find the specific one
    const mismatches = await this.getCurrentMismatches();
    const mismatch = mismatches.find(m => m.id === mismatchId);

    if (!mismatch) {
      this.logger.warn(`Mismatch ${mismatchId} not found`);
      return false;
    }

    try {
      switch (mismatch.type) {
        case 'BATCH_QUANTITY':
          return await this.revertBatchQuantityMismatch(mismatch, adminId);

        case 'LISTING_QUANTITY':
          return await this.revertListingQuantityMismatch(mismatch, adminId);

        case 'RETIREMENT_AMOUNT':
          return await this.revertRetirementAmountMismatch(mismatch, adminId);

        case 'MISSING_ONCHAIN':
          return await this.revertMissingOnChainMismatch(mismatch, adminId);

        default:
          this.logger.warn(`Revert not supported for mismatch type: ${mismatch.type}`);
          return false;
      }
    } catch (error) {
      this.logger.error(`Error reverting mismatch ${mismatchId}:`, error);
      return false;
    }
  }

  private async revertBatchQuantityMismatch(mismatch: Mismatch, adminId: string): Promise<boolean> {
    // For batch quantity mismatches, we need to update the batch to match blockchain
    const batchId = mismatch.entityId;
    const blockchainValue = mismatch.blockchainValue as number;

    await this.prisma.creditBatch.update({
      where: { id: batchId },
      data: { quantity: blockchainValue },
    });

    this.logger.log(`Admin ${adminId} reverted batch ${batchId} quantity to ${blockchainValue}`);
    return true;
  }

  private async revertListingQuantityMismatch(mismatch: Mismatch, adminId: string): Promise<boolean> {
    // For listing quantity mismatches, update the listing to match blockchain
    const listingId = mismatch.entityId;
    const blockchainValue = mismatch.blockchainValue as number;

    await this.prisma.creditListing.update({
      where: { id: listingId },
      data: { availableUnits: blockchainValue },
    });

    this.logger.log(`Admin ${adminId} reverted listing ${listingId} quantity to ${blockchainValue}`);
    return true;
  }

  private async revertRetirementAmountMismatch(mismatch: Mismatch, adminId: string): Promise<boolean> {
    // For retirement amount mismatches, update the retirement record
    const retirementId = mismatch.entityId;
    const blockchainValue = mismatch.blockchainValue as number;

    await this.prisma.retirementRecord.update({
      where: { id: retirementId },
      data: { unitsRetired: blockchainValue },
    });

    this.logger.log(`Admin ${adminId} reverted retirement ${retirementId} amount to ${blockchainValue}`);
    return true;
  }

  private async revertMissingOnChainMismatch(mismatch: Mismatch, adminId: string): Promise<boolean> {
    // For missing on-chain references, we might need to delete the record
    // or mark it as invalid. This is more complex and depends on the entity type.

    switch (mismatch.entityType) {
      case 'Transaction':
        // Delete orphaned transaction
        await this.prisma.transaction.delete({
          where: { id: mismatch.entityId },
        });
        this.logger.log(`Admin ${adminId} deleted orphaned transaction ${mismatch.entityId}`);
        return true;

      case 'RetirementRecord':
        // Delete orphaned retirement
        await this.prisma.retirementRecord.delete({
          where: { id: mismatch.entityId },
        });
        this.logger.log(`Admin ${adminId} deleted orphaned retirement ${mismatch.entityId}`);
        return true;

      default:
        this.logger.warn(`Cannot revert missing on-chain mismatch for entity type: ${mismatch.entityType}`);
        return false;
    }
  }
}