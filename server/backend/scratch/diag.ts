import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DB DIAGNOSTIC ---');
  
  const companies = await prisma.company.findMany({
    include: {
      _count: {
        select: {
          transactions: true,
          retirements: true,
          producedBatches: true
        }
      }
    }
  });

  console.log('Total Companies:', companies.length);
  
  for (const c of companies) {
    console.log(`Company: ${c.name} (${c.role})`);
    console.log(` - ID: ${c.id}`);
    console.log(` - Profile: Tx: ${c._count.transactions}, Retirements: ${c._count.retirements}, Batches: ${c._count.producedBatches}`);
    
    if (c._count.transactions > 0) {
      const txs = await prisma.transaction.findMany({
        where: { buyerId: c.id }
      });
      console.log(`   Transactions Statuses:`, txs.map(t => t.status));
    }
  }

  const logs = await prisma.auditLog.count();
  console.log('Total Audit Logs:', logs);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
