import {
  HttpException,
  HttpStatus,
  // Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Response, Request as CustomRequest } from 'express';
import { CookieOptions } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
// import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CheckAuthResponseDto } from './dto/check-auth.response.dto';

import { RefreshTokenNotFoundException } from './exceptions/refresh-token-not-found.exception';
import { InvalidRefreshTokenException } from './exceptions/invalid-refresh-token.exception';
import { JwtPayload } from './interfaces/jwt-payload.interface';

type AuthRequest = CustomRequest & {
  cookies?: {
    refreshToken?: string;
  };
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshJwtSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    // private readonly subscriptionService: SubscriptionService,
    private readonly configService: ConfigService,
    // @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.refreshJwtSecret =
      this.configService.get<string>('REFRESH_JWT_SECRET');
  }

  getCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') !== 'development',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: this.configService.get('COOKIE_DOMAIN'),
      path: '/api/v1/auth',
    };
  }

  private signAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  async generateNewTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
    };
    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshJwtSecret,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private unauthorizedResponse(response: Response): CheckAuthResponseDto {
    response.status(HttpStatus.UNAUTHORIZED);
    return { isAuthenticated: false };
  }

  async logout(req: AuthRequest, response: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        throw new RefreshTokenNotFoundException();
      }

      response.clearCookie('refreshToken', this.getCookieOptions());

      // if (refreshToken) {
      //   await this.cacheManager.del(`refresh:${refreshToken}`);
      // }

      return { message: 'Successfully logged out' };
    } catch (error) {
      throw new HttpException(
        'Failed to logout',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async checkAuth(
    req: AuthRequest,
    res: Response,
  ): Promise<CheckAuthResponseDto> {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return this.unauthorizedResponse(res);
      }

      const decoded = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('REFRESH_JWT_SECRET'),
      });

      if (!decoded.sub) {
        return this.unauthorizedResponse(res);
      }

      const [currentUser] = await Promise.all([
        this.usersService.findByRefreshToken(refreshToken),
      ]);

      if (!currentUser) {
        return this.unauthorizedResponse(res);
      }

      const { accessToken } = await this.generateNewTokens(currentUser);

      res.status(HttpStatus.OK);

      return {
        accessToken,
        isAuthenticated: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.error('Error in checkAuth:', errorMessage);
      return this.unauthorizedResponse(res);
    }
  }

  async refreshTokens(req: AuthRequest, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        throw new RefreshTokenNotFoundException();
      }

      // const cachedUser = await this.cacheManager.get<string>(
      //   `refresh:${refreshToken}`,
      // );
      // let user: User;

      // if (cachedUser) {
      //   user = JSON.parse(cachedUser);
      // } else {
      const user = await this.usersService.findByRefreshToken(refreshToken);

      if (!user) {
        throw new InvalidRefreshTokenException();
      }

      // await this.cacheManager.set(
      //   `refresh:${refreshToken}`,
      //   JSON.stringify(user),
      // );
      // }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await this.generateNewTokens(user);
      await this.usersService.saveRefreshToken(user.id, newRefreshToken);

      res.cookie('refreshToken', newRefreshToken, this.getCookieOptions());

      return {
        accessToken: newAccessToken,
        expiresIn: '15m',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.error('Error in refreshTokens:', errorMessage);
      throw new InvalidRefreshTokenException();
    }
  }
}
