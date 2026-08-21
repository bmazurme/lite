import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

import { OauthService } from './oauth.service';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';

const mockUser = () => ({ id: 1, email: 'test@example.com' }) as any;

const configValues: Record<string, string | null> = {
  NOTES_TARGET_URL: 'http://localhost:5173',
  EMAILS: null,
};

describe('OauthService', () => {
  let service: OauthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    saveRefreshToken: jest.fn(),
  };

  const mockAuthService = {
    generateNewTokens: jest.fn(),
    getCookieOptions: jest.fn().mockReturnValue({ httpOnly: true }),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => configValues[key] ?? null),
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    configValues.NOTES_TARGET_URL = 'http://localhost:5173';
    configValues.EMAILS = null;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OauthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    service = module.get<OauthService>(OauthService);
    jest.clearAllMocks();
    mockConfigService.get.mockImplementation(
      (key: string) => configValues[key] ?? null,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTargetUrl', () => {
    it('returns the configured URL', () => {
      expect(service.getTargetUrl()).toBe('http://localhost:5173');
    });

    it('throws when NOTES_TARGET_URL is not configured', () => {
      configValues.NOTES_TARGET_URL = null;

      expect(() => service.getTargetUrl()).toThrow(
        'NOTES_TARGET_URL is not configured',
      );
    });
  });

  describe('signinOrSignup', () => {
    const res = { cookie: jest.fn(), redirect: jest.fn() } as any;

    beforeEach(() => {
      res.cookie.mockClear();
      res.redirect.mockClear();
    });

    describe('email whitelist', () => {
      it('redirects to /oauth-error when email is not in EMAILS list', async () => {
        configValues.EMAILS = 'allowed@example.com,other@example.com';

        await service.signinOrSignup(mockUser(), res);

        expect(res.redirect).toHaveBeenCalledWith(
          'http://localhost:5173/oauth-error',
        );
        expect(mockUsersService.findByEmail).not.toHaveBeenCalled();
      });

      it('proceeds when email is in EMAILS list', async () => {
        configValues.EMAILS = 'test@example.com,other@example.com';
        const user = mockUser();
        mockCache.get.mockResolvedValue(user);
        mockAuthService.generateNewTokens.mockResolvedValue({
          refreshToken: 'rt',
          accessToken: 'at',
        });
        mockUsersService.saveRefreshToken.mockResolvedValue(undefined);
        mockCache.set.mockResolvedValue(undefined);

        await service.signinOrSignup(user, res);

        expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173');
      });

      it('proceeds when EMAILS is not set', async () => {
        configValues.EMAILS = null;
        const user = mockUser();
        mockCache.get.mockResolvedValue(user);
        mockAuthService.generateNewTokens.mockResolvedValue({
          refreshToken: 'rt',
          accessToken: 'at',
        });
        mockUsersService.saveRefreshToken.mockResolvedValue(undefined);
        mockCache.set.mockResolvedValue(undefined);

        await service.signinOrSignup(user, res);

        expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173');
      });

      it('ignores extra spaces around emails in EMAILS list', async () => {
        configValues.EMAILS = '  test@example.com , other@example.com  ';
        const user = mockUser();
        mockCache.get.mockResolvedValue(user);
        mockAuthService.generateNewTokens.mockResolvedValue({
          refreshToken: 'rt',
          accessToken: 'at',
        });
        mockUsersService.saveRefreshToken.mockResolvedValue(undefined);
        mockCache.set.mockResolvedValue(undefined);

        await service.signinOrSignup(user, res);

        expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173');
      });
    });

    it('uses cached user when available', async () => {
      const user = mockUser();
      mockCache.get.mockResolvedValue(user);
      mockAuthService.generateNewTokens.mockResolvedValue({
        refreshToken: 'rt',
        accessToken: 'at',
      });
      mockUsersService.saveRefreshToken.mockResolvedValue(undefined);
      mockCache.set.mockResolvedValue(undefined);

      await service.signinOrSignup(user, res);

      expect(mockUsersService.findByEmail).not.toHaveBeenCalled();
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'rt',
        expect.any(Object),
      );
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173');
    });

    it('finds existing user from DB on cache miss', async () => {
      const user = mockUser();
      mockCache.get.mockResolvedValue(null);
      mockUsersService.findByEmail.mockResolvedValue(user);
      mockAuthService.generateNewTokens.mockResolvedValue({
        refreshToken: 'rt',
        accessToken: 'at',
      });
      mockUsersService.saveRefreshToken.mockResolvedValue(undefined);
      mockCache.set.mockResolvedValue(undefined);

      await service.signinOrSignup(user, res);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockUsersService.create).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173');
    });

    it('creates new user when not found in DB', async () => {
      const user = mockUser();
      mockCache.get.mockResolvedValue(null);
      mockUsersService.findByEmail
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(user);
      mockUsersService.create.mockResolvedValue(undefined);
      mockAuthService.generateNewTokens.mockResolvedValue({
        refreshToken: 'rt',
        accessToken: 'at',
      });
      mockUsersService.saveRefreshToken.mockResolvedValue(undefined);
      mockCache.set.mockResolvedValue(undefined);

      await service.signinOrSignup(user, res);

      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173');
    });

    it('throws when user creation fails', async () => {
      const user = mockUser();
      mockCache.get.mockResolvedValue(null);
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(undefined);

      await expect(service.signinOrSignup(user, res)).rejects.toThrow(
        'Failed to create user with email: test@example.com',
      );
    });
  });
});
