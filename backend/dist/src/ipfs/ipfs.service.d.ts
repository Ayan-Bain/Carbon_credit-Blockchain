export declare class IpfsService {
    private readonly logger;
    private readonly pinataApiKey;
    private readonly pinataSecretApiKey;
    uploadFile(file: Express.Multer.File): Promise<string>;
    uploadJson(jsonData: any): Promise<string>;
}
