import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { UserRole, UserStatus } from '@vendorse/shared';

const USER_ROLES: UserRole[] = ['ADMIN', 'BUYER', 'VENDOR', 'REVIEWER'];
const USER_STATUSES: UserStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
  ) {
    if (role && !USER_ROLES.includes(role)) {
      throw new BadRequestException('Invalid role filter');
    }

    if (status && !USER_STATUSES.includes(status)) {
      throw new BadRequestException('Invalid status filter');
    }

    const pageNum = page ? Number(page) : 1;
    const requestedPageSize = limit ? Number(limit) : 10;

    if (!Number.isInteger(pageNum) || pageNum < 1) {
      throw new BadRequestException('page must be a positive integer');
    }

    if (!Number.isInteger(requestedPageSize) || requestedPageSize < 1) {
      throw new BadRequestException('limit must be a positive integer');
    }

    const pageSize = Math.min(requestedPageSize, 100);
    const skip = (pageNum - 1) * pageSize;

    const [users, total] = await Promise.all([
      this.usersService.findAll({
        skip,
        take: pageSize,
        role,
        status,
      }),
      this.usersService.countUsers({ role, status }),
    ]);

    return {
      users,
      pagination: {
        total,
        page: pageNum,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  updateUser(
    @Request() req,
    @Param('id') id: string,
    @Body()
    updateData: {
      name?: string;
      email?: string;
      password?: string;
      role?: UserRole;
      status?: UserStatus;
    },
  ) {
    if (updateData.role && !USER_ROLES.includes(updateData.role)) {
      throw new BadRequestException('Invalid role');
    }

    if (updateData.status && !USER_STATUSES.includes(updateData.status)) {
      throw new BadRequestException('Invalid status');
    }

    if (updateData.name !== undefined && !updateData.name.trim()) {
      throw new BadRequestException('Name cannot be empty');
    }

    if (
      updateData.email !== undefined &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email.trim())
    ) {
      throw new BadRequestException('Enter a valid email address');
    }

    return this.usersService.updateUser(
      id,
      req.user.id,
      req.ip || '127.0.0.1',
      updateData,
    );
  }
}
