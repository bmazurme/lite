import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { PassportModule } from '@nestjs/passport';

import { OauthService } from './oauth.service';
import { OauthController } from './oauth.controller';

import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

import { YandexStrategy } from './strategies/yandex.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    CacheModule.register({
      ttl: 600, // 10 минут
      max: 100, // максимум 100 записей
    }),
    PassportModule.register({
      defaultStrategy: 'yandex',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not configured');
        }
        return {
          secret,
          signOptions: { expiresIn: '15m' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [OauthController],
  providers: [OauthService, YandexStrategy, JwtStrategy],
  exports: [OauthService],
})
export class OauthModule {}
