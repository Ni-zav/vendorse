import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { OrgType } from '@vendorse/shared';
import { compare, hash } from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: { id: string; email: string }) {
    const payload = { email: user.email, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async registerVendor(data: {
    email: string;
    password: string;
    name: string;
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
  }) {
    const email = data.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const countryCode = data.organization.countryCode.trim().toUpperCase();
    const registrationNumber = data.organization.registrationNumber.trim();
    const existingOrganization = await this.prisma.organization.findUnique({
      where: {
        countryCode_registrationNumber: {
          countryCode,
          registrationNumber,
        },
      },
      select: { id: true },
    });
    if (existingOrganization) {
      throw new ConflictException(
        'A supplier with this legal registration already exists. Ask its organization admin to invite you.',
      );
    }

    const hashedPassword = await hash(data.password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: data.organization.name.trim(),
          type: data.organization.type,
          address: data.organization.address.trim(),
          legalName: data.organization.legalName.trim(),
          registrationNumber,
          countryCode,
          taxId: data.organization.taxId?.trim() || null,
          domain: data.organization.domain?.trim().toLowerCase() || null,
          supplierStatus: 'PENDING_REVIEW',
        },
      });

      return tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name: data.name.trim(),
          orgId: organization.id,
          role: 'VENDOR',
          status: 'ACTIVE',
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });
    });

    return this.login(user);
  }
}
