import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient, Prisma } from '@vendorse/database';
import { TenderStatus, BidStatus } from '@vendorse/shared';

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
    deadline: Date;
    createdById: string;
  }) {
    return this.prisma.tender.create({
      data: {
        ...data,
        status: 'DRAFT',
      },
    });
  }

  async publishTender(tenderId: string, userId: string) {
    const tender = await this.prisma.tender.findUnique({
      where: { id: tenderId },
      include: { createdBy: true },
    });

    if (!tender) {
      throw new NotFoundException('Tender not found');
    }

    if (tender.createdById !== userId) {
      throw new ForbiddenException('Not authorized to publish this tender');
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

      if (data.documents?.length > 0) {
        await tx.bidDocument.createMany({
          data: data.documents.map((doc) => ({
            bidId: bid.id,
            ...doc,
          })),
        });
      }

      return bid;
    });
  }

  async evaluateBid(data: {
    bidId: string;
    reviewerId: string;
    criteria: string;
    score: number;
    notes?: string;
  }) {
    const bid = await this.prisma.bid.findUnique({
      where: { id: data.bidId },
      include: { tender: true },
    });

    if (!bid || bid.status !== 'SUBMITTED') {
      throw new NotFoundException('Bid not found or not available for evaluation');
    }

    return this.prisma.evaluationScore.create({
      data: {
        bidId: data.bidId,
        reviewerId: data.reviewerId,
        criteria: data.criteria,
        score: data.score,
        notes: data.notes,
      },
    });
  }

  async awardTender(tenderId: string, bidId: string, userId: string) {
    const tender = await this.prisma.tender.findUnique({
      where: { id: tenderId },
      include: {
        createdBy: true,
        bids: {
          where: { id: bidId },
          include: { evaluations: true },
        },
      },
    });

    if (!tender) {
      throw new NotFoundException('Tender not found');
    }

    if (tender.createdById !== userId) {
      throw new ForbiddenException('Not authorized to award this tender');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update tender status
      await tx.tender.update({
        where: { id: tenderId },
        data: { status: 'AWARDED' },
      });

      // Update winning bid
      await tx.bid.update({
        where: { id: bidId },
        data: { status: 'ACCEPTED' },
      });

      // Update other bids
      await tx.bid.updateMany({
        where: {
          tenderId,
          id: { not: bidId },
          status: 'SUBMITTED',
        },
        data: { status: 'REJECTED' },
      });

      return tender;
    });
  }

  async getTenderById(tenderId: string, userRole?: string) {
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

    // Role-based visibility rules
    if (userRole === 'VENDOR' && tender.status === 'DRAFT') {
      throw new ForbiddenException('This tender is not yet published');
    }

    if (userRole === 'REVIEWER' && !['PUBLISHED', 'UNDER_REVIEW'].includes(tender.status)) {
      throw new ForbiddenException('This tender is not available for review');
    }

    return tender;
  }

  async getUserBids(userId: string) {
    const bids = await this.prisma.bid.findMany({
      where: { submittedById: userId },
      include: {
        tender: {
          select: {
            id: true,
            title: true,
            description: true,
            budget: true,
            deadline: true,
            status: true
          }
        },
        evaluations: {
          include: {
            reviewer: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });
    return bids;
  }

  async listTenders(params: {
    status?: TenderStatus[];
    search?: string;
    page?: number;
    limit?: number;
    role?: string;
  }) {
    const { status, search, page = 1, limit = 10, role } = params;
    
    const where: Prisma.TenderWhereInput = {
      ...(status ? { status: { in: status } } : {}),
      ...(role === 'VENDOR' ? { status: 'PUBLISHED' } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

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
            select: { bids: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tender.count({ where }),
    ]);

    return {
      tenders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}