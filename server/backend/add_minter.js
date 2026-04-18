require('dotenv').config();
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

async function run() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    await prisma.$executeRaw`ALTER TYPE "CompanyRole" ADD VALUE 'MINTER'`;
    console.log('MINTER role added successfully');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();