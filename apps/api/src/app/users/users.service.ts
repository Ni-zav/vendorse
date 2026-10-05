import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@vendorse/database';
import { hash } from 'bcrypt';
import { UserRole, UserStatus } from '@vendorse/shared';

@Injectable()
export class UsersService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    role?: UserRole;
    status?: UserStatus;
  }) {
    const { skip, take, role, status } = params;

    return this.prisma.user.findMany({
      skip,
      take,
      where: {
        ...(role && { role }),
        ...(status && { status }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        organization: {
          select: {
            name: true,
            type: true,
          },
        },
        createdAt: true,
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(
    id: string,
    actorId: string,
    ipAddress: string,
    data: {
      name?: string;
      email?: string;
      password?: string;
      role?: UserRole;
      status?: UserStatus;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      actorId === id &&
      ((data.role && data.role !== 'ADMIN') ||
        (data.status && data.status !== 'ACTIVE'))
    ) {
      throw new BadRequestException(
        'You cannot remove your own active administrator access',
      );
    }

    const normalizedEmail = data.email?.trim().toLowerCase();

    if (normalizedEmail) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }

    if (data.password && data.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const password = data.password ? await hash(data.password, 12) : undefined;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name.trim() }),
          ...(normalizedEmail && { email: normalizedEmail }),
          ...(password && { password }),
          ...(data.role && { role: data.role }),
          ...(data.status && { status: data.status }),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              address: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          actionType: 'USER_UPDATED',
          targetId: id,
          targetType: 'USER',
          ipAddress,
        },
      });

      return updated;
    });
  }

  async countUsers(params: { role?: UserRole; status?: UserStatus }) {
    const { role, status } = params;

    return this.prisma.user.count({
      where: {
        ...(role && { role }),
        ...(status && { status }),
      },
    });
  }
}
