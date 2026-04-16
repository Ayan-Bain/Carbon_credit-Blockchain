import { MarketService } from './market.service';
export declare class MarketController {
    private readonly marketService;
    constructor(marketService: MarketService);
    createListing(req: any, body: {
        batchId: string;
        price: number;
        amount: number;
    }): Promise<any>;
    getListings(): Promise<any[]>;
    buyListing(req: any, id: string, body: {
        amount: number;
    }): Promise<{
        status: string;
        transactionId: string;
        listingId: string;
        amount: number;
        txHash: any;
    }>;
}
