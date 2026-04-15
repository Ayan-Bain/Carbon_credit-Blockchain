"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var IpfsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpfsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const FormData = require("form-data");
let IpfsService = IpfsService_1 = class IpfsService {
    constructor() {
        this.logger = new common_1.Logger(IpfsService_1.name);
        this.pinataApiKey = process.env.PINATA_API_KEY;
        this.pinataSecretApiKey = process.env.PINATA_API_SECRET;
    }
    async uploadFile(file) {
        const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
        const data = new FormData();
        data.append('file', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
        });
        try {
            const response = await axios_1.default.post(url, data, {
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${data.getBoundary()}`,
                    pinata_api_key: this.pinataApiKey,
                    pinata_secret_api_key: this.pinataSecretApiKey,
                },
            });
            return response.data.IpfsHash;
        }
        catch (error) {
            this.logger.error('IPFS File Upload Error:', error.response?.data || error.message);
            throw new common_1.InternalServerErrorException('Failed to upload file to IPFS');
        }
    }
    async uploadJson(jsonData) {
        const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
        try {
            const response = await axios_1.default.post(url, jsonData, {
                headers: {
                    'Content-Type': 'application/json',
                    pinata_api_key: this.pinataApiKey,
                    pinata_secret_api_key: this.pinataSecretApiKey,
                },
            });
            return response.data.IpfsHash;
        }
        catch (error) {
            this.logger.error('IPFS JSON Upload Error:', error.response?.data || error.message);
            throw new common_1.InternalServerErrorException('Failed to upload metadata JSON to IPFS');
        }
    }
};
exports.IpfsService = IpfsService;
exports.IpfsService = IpfsService = IpfsService_1 = __decorate([
    (0, common_1.Injectable)()
], IpfsService);
//# sourceMappingURL=ipfs.service.js.map