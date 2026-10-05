import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@vendorse/database';
import { TenderStatus } from '@vendorse/shared';

type RequestUser = {
  id: string;
  role: string;
  orgId?: string;
};

@Injectable()
export class TenderService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createTender(data: {
    title: string;
    description: string;
    budget: number;
    deadline: Date | string;
    createdById: string;
  }) {
    const deadline = new Date(data.deadline);

    if (!Number.isFinite(data.budget) || data.budget <= 0) {
      throw new BadRequestException('Tender budget must be greater than zero');
    }

    if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
      throw new BadRequestException('Tender deadline must be in the future');
    }

    return this.prisma.tender.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        budget: data.budget,
        deadline,
        createdById: data.createdById,
        status: 'DRAFT',
      },
    });
  }

  async publishTender(tenderId: string, user: RequestUser) {
    const tender = await this.prisma.tender.findUnique({
      where: { id: tenderId },
    });

    if (!tender) {
      throw new NotFoundException('Tender not found');
    }

    if (user.role !== 'ADMIN' && tender.createdById !== user.id) {
      throw new ForbiddenException('Not authorized to publish this tender');
    }

    if (tender.status !== 'DRAFT') {
      throw new ConflictException('Only draft tenders can be published');
    }

    if (tender.deadline <= new Date()) {
      throw new BadRequestException('Tender deadline must be in the future before publication');
    }

    return this.prisma.tender.update({
      where: { id: tenderId },
      data: { status: 'PUBLISHED' },
      include: {
        documents: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            organization: true,
          },
        },
        bids: {
          include: {
            submittedBy: {
              select: {
                id: true,
                name: true,
                organization: true,
              },
            },
            documents: true,
            evaluations: {
              include: {
                reviewer: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async submitBid(data: {
    tenderId: string;
    submittedById: string;
    orgId: string;
    documents: Array<{ filePath: string; signatureHash: string }>;
  }) {
    const tender = await this.prisma.tender.findUnique({
      where: { id: data.tenderId },
    });

    if (!tender || tender.status !== 'PUBLISHED') {
      throw new NotFoundException('Tender not found or not open for bidding');
    }

    if (tender.deadline <= new Date()) {
      throw new ConflictException('The submission deadline has passed');
    }

    if (!data.documents?.length) {
      throw new BadRequestException('At least one proposal document is required');
    }

    const existingBid = await this.prisma.bid.findFirst({
      where: {
        tenderId: data.tenderId,
        orgId: data.orgId,
        status: {
          not: 'WITHDRAWN',
        },
      },
      select: { id: true },
    });

    if (existingBid) {
      throw new ConflictException('Your organization has already submitted a bid for this tender');
    }

    return this.prisma.$transaction(async (tx) => {
      const bid = await tx.bid.create({
        data: {
          tenderId: data.tenderId,
          submittedById: data.submittedById,
          orgId: data.orgId,
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });

      await tx.bidDocument.createMany({
        data: data.documents.map((doc) => ({
          bidId: bid.id,
          filePath: doc.filePath,
          signatureHash: doc.signatureHash,
        })),
      });

      await tx.notification.create({
        data: {
          userId: tender.createdById,
          type: 'BID_SUBMITTED',
          message: 'A new bid was submitted for tender "' + tender.title + '".',
        },
      });

      return bid;
    });
  }

  async evaluateBid(data: {
    bidId: string;
    reviewerId: string;
    scores: Record<string, number>;
    comments: string;
    recommendation: 'ACCEPT' | 'REJECT' | 'REQUEST_CLARIFICATION';
    ipAddress: string;
  }) {
    const bid = await this.prisma.bid.findUnique({
      where: { id: data.bidId },
      include: {
        tender: true,
        submittedBy: true,
        evaluations: {
          where: {
            reviewerId: data.reviewerId,
          },
          select: { id: true },
        },
      },
    });

    if (!bid) {
      throw new NotFoundException('Bid not found');
    }

    const reviewer = await this.prisma.user.findUnique({
      where: { id: data.reviewerId },
      select: { orgId: true },
    });

    if (!reviewer) {
      throw new NotFoundException('Reviewer not found');
    }

    if (reviewer.orgId === bid.orgId) {
      throw new ForbiddenException(
        'Reviewers cannot evaluate a bid from their own organization',
      );
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(bid.status)) {
      throw new ForbiddenException('Bid is not available for evaluation');
    }

    if (!['PUBLISHED', 'UNDER_REVIEW'].includes(bid.tender.status)) {
      throw new ForbiddenException('Tender is not available for evaluation');
    }

    if (bid.tender.deadline > new Date()) {
      throw new ForbiddenException('Evaluation cannot begin before the submission deadline');
    }

    if (bid.evaluations.length > 0) {
      throw new ConflictException('You have already evaluated this bid');
    }

    const scoreEntries = Object.entries(data.scores);
    if (scoreEntries.length === 0) {
      throw new BadRequestException('At least one evaluation score is required');
    }

    for (const [, score] of scoreEntries) {
      if (!Number.isFinite(score) || score < 0 || score > 100) {
        throw new BadRequestException('Evaluation scores must be between 0 and 100');
      }
    }

    if (!data.comments.trim()) {
      throw new BadRequestException('Evaluation comments are required');
    }

    return this.prisma.$transaction(async (tx) => {
      const evaluations = await Promise.all(
        scoreEntries.map(([criteria, score]) =>
          tx.evaluationScore.create({
            data: {
              bidId: data.bidId,
              reviewerId: data.reviewerId,
              criteria,
              score,
              notes: data.comments.trim(),
              recommendation: data.recommendation,
            },
          }),
        ),
      );

      await tx.notification.create({
        data: {
          userId: bid.submittedBy.id,
          type: 'BID_EVALUATED',
          message: 'Your bid for tender "' + bid.tender.title + '" moved into review.',
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: data.reviewerId,
          actionType: 'BID_SCORECARD_SUBMITTED',
          targetId: data.bidId,
          targetType: 'BID',
          ipAddress: data.ipAddress,
        },
      });

      if (bid.status === 'SUBMITTED') {
        await tx.bid.update({
          where: { id: bid.id },
          data: { status: 'UNDER_REVIEW' },
        });
      }

      if (bid.tender.status === 'PUBLISHED') {
        await tx.tender.update({
          where: { id: bid.tender.id },
          data: { status: 'UNDER_REVIEW' },
        });
      }

      return evaluations;
    });
  }

  async awardTender(
    tenderId: string,
    bidId: string,
    user: RequestUser,
    ipAddress: string,
  ) {
    const tender = await this.prisma.tender.findUnique({
      where: { id: tenderId },
      include: {
        bids: {
          include: {
            evaluations: {
              select: {
                id: true,
                recommendation: true,
              },
            },
          },
        },
      },
    });

    if (!tender) {
      throw new NotFoundException('Tender not found');
    }

    if (user.role !== 'ADMIN' && tender.createdById !== user.id) {
      throw new ForbiddenException('Not authorized to award this tender');
    }

    if (tender.status !== 'UNDER_REVIEW') {
      throw new ConflictException('Tender must be under review before it can be awarded');
    }

    const winningBid = tender.bids.find((bid) => bid.id === bidId);
    if (!winningBid) {
      throw new BadRequestException('Selected bid does not belong to this tender');
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(winningBid.status)) {
      throw new ConflictException('Selected bid is not eligible for award');
    }

    const unevaluatedBids = tender.bids.filter(
      (bid) =>
        ['SUBMITTED', 'UNDER_REVIEW'].includes(bid.status) &&
        bid.evaluations.length === 0,
    );

    if (unevaluatedBids.length > 0) {
      throw new ConflictException(
        'Every active bid must have at least one submitted evaluation before award',
      );
    }

    if (
      !winningBid.evaluations.some(
        (evaluation) => evaluation.recommendation === 'ACCEPT',
      )
    ) {
      throw new ConflictException(
        'Selected bid must have an accept recommendation before award',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.tender.update({
        where: { id: tenderId },
        data: { status: 'AWARDED' },
      });

      await tx.bid.update({
        where: { id: bidId },
        data: { status: 'ACCEPTED' },
      });

      await tx.bid.updateMany({
        where: {
          tenderId,
          id: { not: bidId },
          status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
        },
        data: { status: 'REJECTED' },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          actionType: 'TENDER_AWARDED',
          targetId: tenderId,
          targetType: 'TENDER',
          ipAddress,
        },
      });

      for (const bid of tender.bids) {
        await tx.notification.create({
          data: {
            userId: bid.submittedById,
            type: 'TENDER_AWARDED',
            message:
              bid.id === bidId
                ? 'Your bid was selected for tender "' + tender.title + '".'
                : 'Tender "' + tender.title + '" has been awarded.',
          },
        });
      }
    });

    return this.getTenderById(tenderId, user);
  }

  async getTenderById(tenderId: string, user: RequestUser) {
    const baseTender = await this.prisma.tender.findUnique({
      where: { id: tenderId },
      select: {
        id: true,
        createdById: true,
        status: true,
        deadline: true,
      },
    });

    if (!baseTender) {
      throw new NotFoundException('Tender not found');
    }

    if (user.role === 'BUYER' && baseTender.createdById !== user.id) {
      throw new ForbiddenException('This tender is not owned by your account');
    }

    if (user.role === 'VENDOR' && baseTender.status === 'DRAFT') {
      throw new ForbiddenException('This tender is not yet published');
    }

    if (
      user.role === 'REVIEWER' &&
      !['PUBLISHED', 'UNDER_REVIEW'].includes(baseTender.status)
    ) {
      throw new ForbiddenException('This tender is not available for review');
    }

    if (user.role === 'REVIEWER' && baseTender.deadline > new Date()) {
      throw new ForbiddenException(
        'Bid materials remain sealed until the submission deadline',
      );
    }

    const bidWhere: Prisma.BidWhereInput | undefined =
      user.role === 'VENDOR'
        ? user.orgId
          ? { orgId: user.orgId }
          : { submittedById: user.id }
        : user.role === 'REVIEWER'
          ? {
              status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
              evaluations: {
                none: {
                  reviewerId: user.id,
                },
              },
            }
          : undefined;

    const tender = await this.prisma.tender.findUnique({
      where: { id: tenderId },
      include: {
        documents: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            organization: true,
          },
        },
        bids: {
          where: bidWhere,
          include: {
            submittedBy: {
              select: {
                id: true,
                name: true,
                organization: true,
              },
            },
            documents: true,
            evaluations: {
              include: {
                reviewer: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tender) {
      throw new NotFoundException('Tender not found');
    }

    if (user.role === 'VENDOR' || user.role === 'REVIEWER') {
      return {
        ...tender,
        bids: tender.bids.map((bid) => ({
          ...bid,
          evaluations: [],
        })),
      };
    }

    return tender;
  }

  async getVendorBids(userId: string, orgId?: string) {
    return this.prisma.bid.findMany({
      where: orgId ? { orgId } : { submittedById: userId },
      include: {
        tender: {
          select: {
            id: true,
            title: true,
            description: true,
            budget: true,
            deadline: true,
            status: true,
          },
        },
        documents: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async listTenders(params: {
    status?: TenderStatus[];
    search?: string;
    page?: number;
    limit?: number;
    role?: string;
    userId?: string;
  }) {
    const { status, search, page = 1, limit = 10, role, userId } = params;
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);

    const where: Prisma.TenderWhereInput = {};

    if (role === 'VENDOR') {
      where.status = 'PUBLISHED';
    } else if (role === 'REVIEWER') {
      where.status = status?.length ? { in: status } : { in: ['PUBLISHED', 'UNDER_REVIEW'] };
      where.deadline = { lte: new Date() };
      where.bids = {
        some: {
          status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
          evaluations: {
            none: {
              reviewerId: userId,
            },
          },
        },
      };
    } else {
      if (status?.length) {
        where.status = { in: status };
      }

      if (role === 'BUYER') {
        where.createdById = userId;
      }
    }

    if (search?.trim()) {
      where.OR = [
        {
          title: { contains: search.trim(), mode: 'insensitive' },
        },
        {
          description: { contains: search.trim(), mode: 'insensitive' },
        },
      ];
    }

    const [tenders, total] = await Promise.all([
      this.prisma.tender.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              organization: true,
            },
          },
          _count: {
            select: {
              bids: true,
            },
          },
        },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.tender.count({ where }),
    ]);

    return {
      tenders,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }
}
