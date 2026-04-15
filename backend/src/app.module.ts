import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BlockchainSyncModule } from './blockchain-sync/blockchain-sync.module';
import { CreditsModule } from './credits/credits.module';

@Module({
  imports: [PrismaModule, AuthModule, BlockchainSyncModule, CreditsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
