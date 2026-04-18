import { Module } from '@nestjs/common';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [BlockchainModule, AuditModule],
  controllers: [MarketController],
  providers: [MarketService],
})
export class MarketModule {}
