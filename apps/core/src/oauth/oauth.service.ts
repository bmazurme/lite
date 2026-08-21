import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  getTargetUrl() {
    const targetUrl = this.configService.get<string>('NOTES_TARGET_URL');

    if (!targetUrl) {
      throw new Error('NOTES_TARGET_URL is not configured');
    }
    return targetUrl;
  }

  async signinOrSignup({ email }: User, response: Response): Promise<void> {
    const allowedEmails = this.configService.get<string>('EMAILS');
    if (allowedEmails) {
      const list = allowedEmails
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);
      if (!list.includes(email)) {
        this.logger.warn(
          `Blocked OAuth attempt for unregistered email: ${email}`,
        );
        return response.redirect(`${this.getTargetUrl()}/oauth-error`);
      }
    }

    let currentUser: User | null = await this.cacheManager.get(email);

    if (!currentUser) {
      currentUser = await this.usersService.findByEmail(email);

      if (!currentUser) {
        await this.usersService.create({ email });
        currentUser = await this.usersService.findByEmail(email);

        if (!currentUser) {
          this.logger.error(`Failed to create user with email: ${email}`);
          throw new Error(`Failed to create user with email: ${email}`);
        }
      }

      await this.cacheManager.set(email, currentUser);
    }

    const { refreshToken } =
      await this.authService.generateNewTokens(currentUser);

    await this.usersService.saveRefreshToken(currentUser.id, refreshToken);
    await this.cacheManager.set(
      `refresh:${refreshToken}`,
      JSON.stringify(currentUser),
    );

    response.cookie(
      'refreshToken',
      refreshToken,
      this.authService.getCookieOptions(),
    );

    response.redirect(this.getTargetUrl().toString());
  }
}
