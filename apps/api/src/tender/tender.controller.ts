import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TenderService } from './tender.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('tenders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenderController {
  constructor(private readonly tenderService: TenderService) {}

  @Post()
  @Roles('ADMIN', 'BUYER')
  async createTender(
    @Body() createTenderDto: {
      title: string;
      description: string;
      budget: number;
      deadline: Date;
    },
    @Request() req,
  ) {
    return this.tenderService.createTender({
      ...createTenderDto,
      createdById: req.user.id,
    });
  }

  @Put(':id/publish')
  @Roles('ADMIN', 'BUYER')
  async publishTender(@Param('id') id: string, @Request() req) {
    return this.tenderService.publishTender(id, req.user.id);
  }

  @Post(':id/bids')
  @Roles('VENDOR')
  async submitBid(
    @Param('id') tenderId: string,
    @Body() submitBidDto: {
      documents: Array<{ filePath: string; signatureHash: string }>;
    },
    @Request() req,
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
    @Param('id') bidId: string,
    @Body() evaluationDto: {
      criteria: string;
      score: number;
      notes?: string;
    },
    @Request() req,
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
    @Param('id') tenderId: string,
    @Param('bidId') bidId: string,
    @Request() req,
  ) {
    return this.tenderService.awardTender(tenderId, bidId, req.user.id);
  }

  @Get(':id')
  async getTender(@Param('id') id: string) {
    return this.tenderService.getTenderById(id);
  }

  @Get()
  async listTenders(
    @Query('status') status?: string[],
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tenderService.listTenders({
      status,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}