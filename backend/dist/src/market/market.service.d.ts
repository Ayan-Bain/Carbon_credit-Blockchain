import { PrismaService } from '../prisma/prisma.service';
export declare class MarketService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createListing(batchId: string, price: number, amount: number, producerId: string): Promise<{
        status: string;
        batchId: string;
        price: number;
        amount: number;
    }>;
    getListings(): Promise<any[]>;
    buyListing(listingId: string, amount: number, buyerId: string): Promise<{
        status: string;
        txHash: string;
        listingId: string;
        amount: number;
    }>;
}
