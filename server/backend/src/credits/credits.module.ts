import { Module } from '@nestjs/common';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { IpfsModule } from '../ipfs/ipfs.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [IpfsModule, BlockchainModule, AuditModule],
  controllers: [CreditsController],
  providers: [CreditsService],
})
export class CreditsModule {}
