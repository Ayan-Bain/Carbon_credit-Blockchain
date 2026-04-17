-- CreateEnum
CREATE TYPE "CompanyRole" AS ENUM ('PRODUCER', 'REGULATOR', 'BUYER', 'BOTH');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'LISTED', 'SOLD_OUT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "role" "CompanyRole" NOT NULL DEFAULT 'BUYER',
    "kycVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditBatch" (
    "id" TEXT NOT NULL,
    "onChainBatchId" TEXT,
    "producerId" TEXT NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'PENDING',
    "quantity" INTEGER NOT NULL,
    "remainingQuantity" INTEGER NOT NULL,
    "metadataIPFSHash" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "txHash" TEXT,

    CONSTRAINT "CreditBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditListing" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "pricePerUnit" DECIMAL(18,2) NOT NULL,
    "availableUnits" INTEGER NOT NULL,
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "unitsPurchased" INTEGER NOT NULL,
    "totalPrice" DECIMAL(18,2) NOT NULL,
    "onChainTxHash" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetirementRecord" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "unitsRetired" INTEGER NOT NULL,
    "purpose" TEXT,
    "retiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "onChainTxHash" TEXT NOT NULL,

    CONSTRAINT "RetirementRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_walletAddress_key" ON "Company"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "CreditBatch_onChainBatchId_key" ON "CreditBatch"("onChainBatchId");

-- AddForeignKey
ALTER TABLE "CreditBatch" ADD CONSTRAINT "CreditBatch_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditBatch" ADD CONSTRAINT "CreditBatch_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditListing" ADD CONSTRAINT "CreditListing_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "CreditBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditListing" ADD CONSTRAINT "CreditListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "CreditListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetirementRecord" ADD CONSTRAINT "RetirementRecord_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetirementRecord" ADD CONSTRAINT "RetirementRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "CreditBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
