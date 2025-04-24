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
    notes?: string | null;
    recommendation?: string | null;
    ipAddress: string;
  }) {
    try {
      console.log('TenderService.evaluateBid - Starting evaluation:', {
        bidId: data.bidId,
        reviewerId: data.reviewerId,
        criteria: data.criteria
      });

      const bid = await this.prisma.bid.findUnique({
        where: { id: data.bidId },
        include: { 
          tender: true,
          submittedBy: true,
          evaluations: {
            where: {
              reviewerId: data.reviewerId,
              criteria: data.criteria
            }
          }
        },
      });

      if (!bid) {
        throw new NotFoundException('Bid not found');
      }

      if (bid.status !== 'SUBMITTED') {
        throw new ForbiddenException('Bid is not available for evaluation');
      }

      const evaluationData = {
        score: data.score,
        notes: data.notes ?? null,
        recommendation: data.recommendation ?? null
      };

      let evaluation;
      if (bid.evaluations.length > 0) {
        // Update existing evaluation
        evaluation = await this.prisma.evaluationScore.update({
          where: { id: bid.evaluations[0].id },
          data: evaluationData
        });

        console.log('TenderService.evaluateBid - Updated existing evaluation:', evaluation);
      } else {
        // Create new evaluation in a transaction with notification and audit log
        const result = await this.prisma.$transaction(async (tx) => {
          // Create evaluation
          const newEvaluation = await tx.evaluationScore.create({
            data: {
              bidId: data.bidId,
              reviewerId: data.reviewerId,
              criteria: data.criteria,
              ...evaluationData
            },
          });

          // Create notification for bid submitter
          await tx.notification.create({
            data: {
              userId: bid.submittedBy.id,
              type: 'BID_EVALUATED',
              message: `Your bid for tender "${bid.tender.title}" has received a new evaluation.`
            }
          });

          // Create audit log entry
          await tx.auditLog.create({
            data: {
              actorId: data.reviewerId,
              actionType: 'BID_EVALUATED',
              targetId: data.bidId,
              targetType: 'BID',
              ipAddress: data.ipAddress
            }
          });

          // Update bid status if needed
          if (bid.status === 'SUBMITTED') {
            await tx.bid.update({
              where: { id: bid.id },
              data: { status: 'UNDER_REVIEW' }
            });
          }

          // Update tender status if needed
          if (bid.tender.status !== 'UNDER_REVIEW') {
            await tx.tender.update({
              where: { id: bid.tender.id },
              data: { status: 'UNDER_REVIEW' }
            });
          }

          return newEvaluation;
        });

        evaluation = result;
        console.log('TenderService.evaluateBid - Created new evaluation:', evaluation);
      }

      return evaluation;
    } catch (error) {
      console.error('TenderService.evaluateBid - Error:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        data
      });
      throw error;
    }
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
          where: userRole === 'REVIEWER' ? { status: 'SUBMITTED' } : undefined,
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
    userId?: string;
  }) {
    const { status, search, page = 1, limit = 10, role, userId } = params;
    
    console.log('TenderService.listTenders - Building query:', {
      status,
      role,
      search,
      userId
    });

    // Build the base where clause
    const where: Prisma.TenderWhereInput = {};

    // Handle role-specific filters
    if (role === 'VENDOR') {
      where.status = 'PUBLISHED';
    } else if (role === 'REVIEWER') {
      // For reviewers, show tenders that have bids needing evaluation
      where.bids = {
        some: {
          status: 'SUBMITTED',
          evaluations: {
            none: {
              reviewerId: userId
            }
          }
        }
      };
    } else if (role === 'BUYER') {
      where.createdById = userId;
    }

    // Add search filter if provided
    if (search) {
      where.OR = [
        ...(where.OR || []),
        {
          title: { contains: search, mode: 'insensitive' }
        },
        {
          description: { contains: search, mode: 'insensitive' }
        }
      ];
    }

    console.log('TenderService.listTenders - Final where clause:', where);

    try {
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
                bids: true
              },
            },
            bids: {
              include: {
                submittedBy: {
                  select: {
                    id: true,
                    name: true,
                    organization: true
                  }
                },
                evaluations: {
                  include: {
                    reviewer: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.tender.count({ where }),
      ]);

      console.log('TenderService.listTenders - Query results:', {
        tenderCount: tenders.length,
        total,
        page,
        hasMore: total > page * limit
      });

      return {
        tenders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('TenderService.listTenders - Database error:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      throw error;
    }
  }
}