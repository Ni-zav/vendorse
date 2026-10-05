import { BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const authService = {
    registerVendor: jest.fn(),
    validateUser: jest.fn(),
    login: jest.fn(),
  } as unknown as jest.Mocked<AuthService>;

  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(authService);
  });

  describe('register', () => {
    it('does not allow public signup to choose a privileged role', async () => {
      authService.registerVendor.mockResolvedValue({
        accessToken: 'token',
      });

      const payload = {
        organization: {
          name: 'Supplier Co',
          type: 'BUSINESS',
          address: 'Yogyakarta',
        },
        user: {
          name: 'Vendor User',
          email: 'vendor@example.com',
          password: 'strong-pass',
          role: 'ADMIN',
        },
      } as any;

      await controller.register(payload);

      expect(authService.registerVendor).toHaveBeenCalledWith({
        email: 'vendor@example.com',
        password: 'strong-pass',
        name: 'Vendor User',
        organization: {
          name: 'Supplier Co',
          type: 'BUSINESS',
          address: 'Yogyakarta',
        },
      });

      const forwarded = authService.registerVendor.mock.calls[0][0] as any;
      expect(forwarded.role).toBeUndefined();
      expect(forwarded.user?.role).toBeUndefined();
    });

    it('rejects passwords shorter than eight characters', async () => {
      const payload = {
        organization: {
          name: 'Supplier Co',
          type: 'BUSINESS',
          address: 'Yogyakarta',
        },
        user: {
          name: 'Vendor User',
          email: 'vendor@example.com',
          password: 'short',
        },
      } as any;

      await expect(controller.register(payload)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(authService.registerVendor).not.toHaveBeenCalled();
    });
  });
});
