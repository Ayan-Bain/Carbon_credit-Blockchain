-- AlterEnum
ALTER TYPE "CompanyRole" ADD VALUE 'MINTER';

-- AlterTable
ALTER TABLE "CreditBatch" ADD COLUMN     "mintingPermit" TEXT,
ADD COLUMN     "verificationHash" TEXT;
