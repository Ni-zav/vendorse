import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OrgType } from '@vendorse/shared';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    if (!loginDto?.email?.trim() || !loginDto?.password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    return this.authService.login(user);
  }

  @Post('register')
  async register(
    @Body()
    registerDto: {
      organization: {
        name: string;
        type: OrgType;
        address: string;
        legalName: string;
        registrationNumber: string;
        countryCode: string;
        taxId?: string;
        domain?: string;
      };
      user: {
        name: string;
        email: string;
        password: string;
      };
    },
  ) {
    if (!registerDto?.organization || !registerDto?.user) {
      throw new BadRequestException('Missing organization or user data');
    }

    const { organization, user } = registerDto;

    if (
      !organization.name?.trim() ||
      !organization.type ||
      !organization.address?.trim() ||
      !organization.legalName?.trim() ||
      !organization.registrationNumber?.trim() ||
      !organization.countryCode?.trim()
    ) {
      throw new BadRequestException('Missing required organization fields');
    }

    if (!['BUSINESS', 'GOVERNMENT', 'NON_PROFIT'].includes(organization.type)) {
      throw new BadRequestException('Invalid organization type');
    }

    if (!/^[A-Za-z]{2}$/.test(organization.countryCode.trim())) {
      throw new BadRequestException('countryCode must be a 2-letter ISO country code');
    }

    if (!user.email?.trim() || !user.password || !user.name?.trim()) {
      throw new BadRequestException('Missing required user fields');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email.trim())) {
      throw new BadRequestException('Enter a valid email address');
    }

    if (user.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    return this.authService.registerVendor({
      email: user.email,
      password: user.password,
      name: user.name,
      organization,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
