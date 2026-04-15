import { MarketService } from './market.service';
export declare class MarketController {
    private readonly marketService;
    constructor(marketService: MarketService);
    createListing(req: any, body: {
        batchId: string;
        price: number;
        amount: number;
    }): Promise<{
        status: string;
        batchId: string;
        price: number;
        amount: number;
    }>;
    getListings(): Promise<any[]>;
    buyListing(req: any, id: string, body: {
        amount: number;
    }): Promise<{
        status: string;
        txHash: string;
        listingId: string;
        amount: number;
    }>;
}
