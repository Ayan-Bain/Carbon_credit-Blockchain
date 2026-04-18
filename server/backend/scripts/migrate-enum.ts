import { PrismaClient } from '@prisma/client';

async function runMigration() {
  const prisma = new PrismaClient();

  try {
    // Add APPROVED to BatchStatus enum
    await prisma.$executeRaw`ALTER TYPE "BatchStatus" ADD VALUE 'APPROVED'`;

    // Add MINTED to BatchStatus enum
    await prisma.$executeRaw`ALTER TYPE "BatchStatus" ADD VALUE 'MINTED'`;

    // Add MINTER to CompanyRole enum
    await prisma.$executeRaw`ALTER TYPE "CompanyRole" ADD VALUE 'MINTER'`;

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();