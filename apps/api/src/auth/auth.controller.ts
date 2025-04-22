import { Controller, Post, Body, Get, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OrgType } from '@vendorse/shared';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    if (!loginDto?.email || !loginDto?.password) {
      throw new BadRequestException('Email and password are required');
    }
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
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
      };
      user: {
        name: string;
        email: string;
        password: string;
        role: string;
      };
    },
  ) {
    if (!registerDto?.organization || !registerDto?.user) {
      throw new BadRequestException('Missing organization or user data');
    }

    const { organization, user } = registerDto;

    if (!organization.name || !organization.type || !organization.address) {
      throw new BadRequestException('Missing required organization fields');
    }

    if (!['BUSINESS', 'GOVERNMENT', 'NON_PROFIT'].includes(organization.type)) {
      throw new BadRequestException('Invalid organization type');
    }

    if (!user.email || !user.password || !user.name) {
      throw new BadRequestException('Missing required user fields');
    }

    const org = await this.authService.createOrganization(
      organization.name,
      organization.type,
      organization.address
    );

    return this.authService.register(
      user.email,
      user.password,
      user.name,
      org.id,
      user.role
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}