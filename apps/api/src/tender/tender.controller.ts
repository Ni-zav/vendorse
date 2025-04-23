import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TenderService } from './tender.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenderStatus } from '@vendorse/shared';

@Controller('tenders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenderController {
  constructor(private readonly tenderService: TenderService) {}

  @Post()
  @Roles('ADMIN', 'BUYER')
  async createTender(
    @Request() req,
    @Body() createTenderDto: {
      title: string;
      description: string;
      budget: number;
      deadline: Date;
    }
  ) {
    return this.tenderService.createTender({
      ...createTenderDto,
      createdById: req.user.id,
    });
  }

  @Put(':id/publish')
  @Roles('ADMIN', 'BUYER')
  async publishTender(@Request() req, @Param('id') id: string) {
    try {
      console.log('Backend - Publishing tender:', {
        tenderId: id,
        userId: req.user.id,
        userRole: req.user.role
      });
      
      const result = await this.tenderService.publishTender(id, req.user.id);
      console.log('Backend - Tender published successfully:', result);
      return result;
    } catch (error) {
      console.error('Backend - Publish tender failed:', {
        tenderId: id,
        userId: req.user.id,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      throw error;
    }
  }

  @Post(':id/bids')
  @Roles('VENDOR')
  async submitBid(
    @Request() req,
    @Param('id') tenderId: string,
    @Body() submitBidDto: {
      documents: Array<{ filePath: string; signatureHash: string }>;
    }
  ) {
    return this.tenderService.submitBid({
      tenderId,
      submittedById: req.user.id,
      orgId: req.user.orgId,
      documents: submitBidDto.documents,
    });
  }

  @Post('bids/:id/evaluate')
  @Roles('REVIEWER')
  async evaluateBid(
    @Request() req,
    @Param('id') bidId: string,
    @Body() evaluationDto: {
      criteria: string;
      score: number;
      notes?: string;
    }
  ) {
    return this.tenderService.evaluateBid({
      bidId,
      reviewerId: req.user.id,
      ...evaluationDto,
    });
  }

  @Put(':id/award/:bidId')
  @Roles('ADMIN', 'BUYER')
  async awardTender(
    @Request() req,
    @Param('id') tenderId: string,
    @Param('bidId') bidId: string
  ) {
    return this.tenderService.awardTender(tenderId, bidId, req.user.id);
  }

  @Get(':id')
  async getTender(@Request() req, @Param('id') id: string) {
    return this.tenderService.getTenderById(id, req.user.role);
  }

  @Get()
  async listTenders(
    @Request() req,
    @Query('status') status?: string[],
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.tenderService.listTenders({
      status: status?.map(s => s as TenderStatus),
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      role: req.user.role,
    });
  }

  @Get('bids/vendor')
  @Roles('VENDOR')
  async getVendorBids(@Request() req) {
    const { id: userId } = req.user;
    return this.tenderService.getUserBids(userId);
  }
}