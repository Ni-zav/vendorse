import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
      orderBy: {
        createdAt: 'desc',
      },
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
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(
    id: string,
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
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('Email already in use');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        ...(data.password && { password: await hash(data.password, 10) }),
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
        updatedAt: true,
      },
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