"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const siwe_1 = require("siwe");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.issuedNonces = new Set();
    }
    generateNonce() {
        const nonce = (0, siwe_1.generateNonce)();
        this.issuedNonces.add(nonce);
        return nonce;
    }
    async register(name, walletAddress, role) {
        const address = walletAddress.toLowerCase();
        let company = await this.prisma.company.findUnique({
            where: { walletAddress: address },
        });
        if (company) {
            throw new common_1.UnauthorizedException('Company already registered');
        }
        return this.prisma.company.create({
            data: {
                name,
                walletAddress: address,
                role: role || client_1.CompanyRole.BUYER,
            },
        });
    }
    async verifySiwe(message, signature) {
        let siweMessage;
        try {
            const siweMsg = new siwe_1.SiweMessage(message);
            const result = await siweMsg.verify({ signature });
            if (result.success === false) {
                throw new common_1.UnauthorizedException('Invalid signature');
            }
            siweMessage = result.data || result;
        }
        catch (e) {
            throw new common_1.UnauthorizedException('Invalid SIWE message or signature');
        }
        if (!this.issuedNonces.has(siweMessage.nonce)) {
            throw new common_1.UnauthorizedException('Invalid or expired nonce');
        }
        this.issuedNonces.delete(siweMessage.nonce);
        const walletAddress = siweMessage.address.toLowerCase();
        let company = await this.prisma.company.findUnique({
            where: { walletAddress },
        });
        const adminAddress = process.env.ADMIN_WALLET_ADDRESS?.toLowerCase();
        const isLocalAdmin = walletAddress === adminAddress;
        if (!company) {
            company = await this.prisma.company.create({
                data: {
                    name: isLocalAdmin ? 'System Admin' : 'New Company',
                    walletAddress,
                    role: isLocalAdmin ? client_1.CompanyRole.ADMIN : client_1.CompanyRole.BUYER,
                },
            });
        }
        else if (isLocalAdmin && company.role !== client_1.CompanyRole.ADMIN) {
            company = await this.prisma.company.update({
                where: { id: company.id },
                data: { role: client_1.CompanyRole.ADMIN },
            });
        }
        const payload = {
            sub: company.id,
            walletAddress: company.walletAddress,
            role: company.role,
        };
        const accessToken = this.jwtService.sign(payload);
        return {
            accessToken,
            user: company,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map