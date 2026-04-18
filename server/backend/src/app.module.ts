import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BlockchainSyncModule } from './blockchain-sync/blockchain-sync.module';
import { CreditsModule } from './credits/credits.module';
import { AdminModule } from './admin/admin.module';
import { MarketModule } from './market/market.module';
import { AuditModule } from './audit/audit.module';
import { IntegrityModule } from './integrity/integrity.module';

@Module({
  imports: [PrismaModule, AuthModule, BlockchainSyncModule, CreditsModule, AdminModule, MarketModule, AuditModule, IntegrityModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
