import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
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
    @Body()
    createTenderDto: {
      title: string;
      description: string;
      budget: number;
      deadline: Date | string;
    },
  ) {
    return this.tenderService.createTender({
      ...createTenderDto,
      createdById: req.user.id,
    });
  }

  @Put(':id/publish')
  @Roles('ADMIN', 'BUYER')
  async publishTender(@Request() req, @Param('id') id: string) {
    return this.tenderService.publishTender(id, {
      id: req.user.id,
      role: req.user.role,
    });
  }

  @Post(':id/bids')
  @Roles('VENDOR')
  async submitBid(
    @Request() req,
    @Param('id') tenderId: string,
    @Body()
    submitBidDto: {
      documents: Array<{ filePath: string; signatureHash: string }>;
    },
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
    @Body()
    evaluationDto: {
      scores: Record<string, number>;
      comments: string;
      recommendation: 'ACCEPT' | 'REJECT' | 'REQUEST_CLARIFICATION';
    },
  ) {
    return this.tenderService.evaluateBid({
      bidId,
      reviewerId: req.user.id,
      scores: evaluationDto.scores,
      comments: evaluationDto.comments,
      recommendation: evaluationDto.recommendation,
      ipAddress: req.ip || '127.0.0.1',
    });
  }

  @Put(':id/award/:bidId')
  @Roles('ADMIN', 'BUYER')
  async awardTender(
    @Request() req,
    @Param('id') tenderId: string,
    @Param('bidId') bidId: string,
  ) {
    return this.tenderService.awardTender(
      tenderId,
      bidId,
      {
        id: req.user.id,
        role: req.user.role,
      },
      req.ip || '127.0.0.1',
    );
  }

  @Get('bids/vendor')
  @Roles('VENDOR')
  async getVendorBids(@Request() req) {
    return this.tenderService.getVendorBids(req.user.id, req.user.orgId);
  }

  @Get(':id')
  async getTender(@Request() req, @Param('id') id: string) {
    return this.tenderService.getTenderById(id, {
      id: req.user.id,
      role: req.user.role,
      orgId: req.user.orgId,
    });
  }

  @Get()
  async listTenders(
    @Request() req,
    @Query('status') status?: string | string[],
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const statusArray = status
      ? (Array.isArray(status) ? status : [status])
      : undefined;

    return this.tenderService.listTenders({
      status: statusArray?.map((value) => value as TenderStatus),
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      role: req.user.role,
      userId: req.user.id,
    });
  }
}
