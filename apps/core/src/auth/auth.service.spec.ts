import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

const mockUser = () =>
  ({ id: 1, email: 'test@example.com', refreshToken: 'old-token' }) as any;

describe('AuthService', () => {
  let service: AuthService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockUsersService = {
    findByRefreshToken: jest.fn(),
    saveRefreshToken: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        REFRESH_JWT_SECRET: 'refresh-secret',
        NODE_ENV: 'development',
        COOKIE_DOMAIN: 'localhost',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateNewTokens', () => {
    it('returns access and refresh tokens', async () => {
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.generateNewTokens(mockUser());

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('logout', () => {
    it('clears refresh token cookie on success', async () => {
      const req = { cookies: { refreshToken: 'some-token' } } as any;
      const res = { clearCookie: jest.fn() } as any;

      const result = await service.logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(Object),
      );
      expect(result).toEqual({ message: 'Successfully logged out' });
    });

    it('throws when no refresh token in cookies', async () => {
      const req = { cookies: {} } as any;
      const res = { clearCookie: jest.fn() } as any;

      await expect(service.logout(req, res)).rejects.toThrow(HttpException);
    });
  });

  describe('checkAuth', () => {
    it('returns isAuthenticated: true with new accessToken', async () => {
      const user = mockUser();
      mockJwtService.verify.mockReturnValue({ sub: 1 });
      mockUsersService.findByRefreshToken.mockResolvedValue(user);
      mockJwtService.sign
        .mockReturnValueOnce('new-access')
        .mockReturnValueOnce('new-refresh');

      const req = { cookies: { refreshToken: 'valid-token' } } as any;
      const res = { status: jest.fn() } as any;

      const result = await service.checkAuth(req, res);

      expect(result).toMatchObject({
        isAuthenticated: true,
        accessToken: 'new-access',
      });
    });

    it('returns isAuthenticated: false when no refresh token', async () => {
      const req = { cookies: {} } as any;
      const res = { status: jest.fn() } as any;

      const result = await service.checkAuth(req, res);

      expect(result).toEqual({ isAuthenticated: false });
    });

    it('returns isAuthenticated: false when user not found', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 1 });
      mockUsersService.findByRefreshToken.mockResolvedValue(null);

      const req = { cookies: { refreshToken: 'valid-token' } } as any;
      const res = { status: jest.fn() } as any;

      const result = await service.checkAuth(req, res);

      expect(result).toEqual({ isAuthenticated: false });
    });
  });

  describe('refreshTokens', () => {
    it('returns new access token and sets refresh token cookie', async () => {
      const user = mockUser();
      mockUsersService.findByRefreshToken.mockResolvedValue(user);
      mockJwtService.sign
        .mockReturnValueOnce('new-access')
        .mockReturnValueOnce('new-refresh');
      mockUsersService.saveRefreshToken.mockResolvedValue(undefined);

      const req = { cookies: { refreshToken: 'valid-token' } } as any;
      const res = { cookie: jest.fn() } as any;

      const result = await service.refreshTokens(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh',
        expect.any(Object),
      );
      expect(result).toMatchObject({ accessToken: 'new-access' });
    });

    it('throws when no refresh token in cookies', async () => {
      const req = { cookies: {} } as any;
      const res = { cookie: jest.fn() } as any;

      await expect(service.refreshTokens(req, res)).rejects.toThrow(
        HttpException,
      );
    });

    it('throws when refresh token not found in DB', async () => {
      mockUsersService.findByRefreshToken.mockResolvedValue(null);

      const req = { cookies: { refreshToken: 'bad-token' } } as any;
      const res = { cookie: jest.fn() } as any;

      await expect(service.refreshTokens(req, res)).rejects.toThrow(
        HttpException,
      );
    });
  });
});
