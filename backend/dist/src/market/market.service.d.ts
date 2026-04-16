import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
export declare class MarketService {
    private readonly prisma;
    private readonly blockchain;
    constructor(prisma: PrismaService, blockchain: BlockchainService);
    createListing(batchId: string, price: number, amount: number, producerId: string): Promise<any>;
    getListings(): Promise<any[]>;
    buyListing(listingId: string, amount: number, buyerId: string): Promise<{
        status: string;
        transactionId: string;
        listingId: string;
        amount: number;
        txHash: any;
    }>;
    private serializeListing;
}
