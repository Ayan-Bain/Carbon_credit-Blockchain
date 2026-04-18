import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { MarketService } from './market.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CompanyRole } from '@prisma/client';

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Post('listings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CompanyRole.PRODUCER)
  async createListing(@Req() req: any, @Body() body: { batchId: string; price: number; amount: number }) {
    return this.marketService.createListing(body.batchId, body.price, body.amount, req.user.id);
  }

  @Get(['listing', 'listings'])
  async getListings() {
    return this.marketService.getListings();
  }

  @Post('listings/:id/buy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CompanyRole.BUYER)
  async buyListing(@Req() req: any, @Param('id') id: string, @Body() body: { amount: number }) {
    return this.marketService.buyListing(id, body.amount, req.user.id);
  }
}
