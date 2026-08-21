/* eslint-disable @typescript-eslint/no-var-requires */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    checkAuth: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(require('./guards/refresh-token.guard').RefreshTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('checkAuth delegates to authService', async () => {
    const req = { cookies: { refreshToken: 'token' } } as any;
    const res = {} as any;
    mockAuthService.checkAuth.mockResolvedValue({
      isAuthenticated: true,
      accessToken: 'abc',
    });

    const result = await controller.checkAuth(req, res);

    expect(mockAuthService.checkAuth).toHaveBeenCalledWith(req, res);
    expect(result).toEqual({ isAuthenticated: true, accessToken: 'abc' });
  });

  it('refreshToken delegates to authService', async () => {
    const req = { cookies: { refreshToken: 'token' } } as any;
    const res = {} as any;
    mockAuthService.refreshTokens.mockResolvedValue({
      accessToken: 'new',
      expiresIn: '15m',
    });

    const result = await controller.refreshToken(req, res);

    expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(req, res);
    expect(result).toMatchObject({ accessToken: 'new' });
  });

  it('logout delegates to authService', async () => {
    const req = { cookies: { refreshToken: 'token' } } as any;
    const res = {} as any;
    mockAuthService.logout.mockResolvedValue({
      message: 'Successfully logged out',
    });

    const result = await controller.logout(req, res);

    expect(mockAuthService.logout).toHaveBeenCalledWith(req, res);
    expect(result).toEqual({ message: 'Successfully logged out' });
  });
});
