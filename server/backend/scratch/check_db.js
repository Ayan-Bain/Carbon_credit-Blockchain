const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const batch = await prisma.creditBatch.findFirst();
  console.log('Batch columns:', Object.keys(batch || {}));
  process.exit(0);
}

check();
