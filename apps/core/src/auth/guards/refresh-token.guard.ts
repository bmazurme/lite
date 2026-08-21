import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UsersService } from '../../users/users.service';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  private readonly logger = new Logger(RefreshTokenGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      this.logger.warn('Refresh token not found in cookies');
      throw new UnauthorizedException('Refresh token is required');
    }

    return this.validateRefreshToken(refreshToken)
      .then(() => true)
      .catch((error) => {
        this.logger.error('Refresh token validation failed:', error.stack);
        throw new UnauthorizedException('Invalid refresh token');
      });
  }

  private async validateRefreshToken(token: string): Promise<void> {
    // 1. Верификация JWT
    const decoded = this.jwtService.verify<JwtPayload>(token, {
      secret: this.configService.get<string>('REFRESH_JWT_SECRET'),
    });

    // 2. Проверка обязательных полей
    if (!decoded.sub) {
      throw new UnauthorizedException(
        'Invalid refresh token payload: missing user ID',
      );
    }

    // 3. Проверка существования токена в БД
    const isTokenValid = await this.usersService.isRefreshTokenValid(
      decoded.sub,
      token,
    );

    if (!isTokenValid) {
      throw new UnauthorizedException('Refresh token not found or expired');
    }

    // Сохраняем данные в запросе для дальнейшего использования
    // request.userId = decoded.sub;
    this.logger.log(`Refresh token validated for user ID ${decoded.sub}`);
  }
}
