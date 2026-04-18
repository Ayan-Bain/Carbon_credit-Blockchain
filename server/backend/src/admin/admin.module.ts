import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { IntegrityModule } from '../integrity/integrity.module';

@Module({
  imports: [PrismaModule, BlockchainModule, IntegrityModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
