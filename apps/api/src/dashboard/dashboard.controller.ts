import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaClient } from '@vendorse/database';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  @Get('stats')
  async getStats(@Request() req) {
    const { id: userId, role } = req.user;
    
    switch (role) {
      case 'BUYER':
      case 'ADMIN': {
        const [totalTenders, activeTenders] = await Promise.all([
          this.prisma.tender.count({
            where: { createdById: userId }
          }),
          this.prisma.tender.count({
            where: { 
              createdById: userId,
              status: 'PUBLISHED'
            }
          })
        ]);

        return {
          totalTenders,
          activeTenders,
          submittedBids: 0,
          pendingEvaluations: 0
        };
      }

      case 'VENDOR': {
        const submittedBids = await this.prisma.bid.count({
          where: { submittedById: userId }
        });

        return {
          totalTenders: 0,
          activeTenders: 0,
          submittedBids,
          pendingEvaluations: 0
        };
      }

      case 'REVIEWER': {
        const pendingEvaluations = await this.prisma.bid.count({
          where: { 
            status: 'SUBMITTED',
            evaluations: {
              none: {
                reviewerId: userId
              }
            }
          }
        });

        return {
          totalTenders: 0,
          activeTenders: 0,
          submittedBids: 0,
          pendingEvaluations
        };
      }

      default:
        return {
          totalTenders: 0,
          activeTenders: 0,
          submittedBids: 0,
          pendingEvaluations: 0
        };
    }
  }
}