import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { OauthModule } from './oauth/oauth.module';
import { UsersModule } from './users/users.module';
import { NotesModule } from './notes/notes.module';
import { TypesModule } from './types/types.module';
import { TagsModule } from './tags/tags.module';
import { MetricsModule } from './metrics/metrics.module';
import { FeedModule } from './feed/feed.module';
import { PrerenderModule } from './prerender/prerender.module';
import { UploadsModule } from './uploads/uploads.module';

import { TypeOrmModuleConfig } from './config/type-orm.config';
import { createWinstonConfig } from './config/logger.config';
import { HttpMetricsInterceptor } from './metrics/metrics.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        createWinstonConfig({
          isDev: configService.get<string>('NODE_ENV') !== 'production',
          lokiHost:
            configService.get<string>('LOKI_HOST') ?? 'http://localhost:3100',
          nodeEnv: configService.get<string>('NODE_ENV') ?? 'production',
        }),
      inject: [ConfigService],
    }),
    TypeOrmModuleConfig,
    AuthModule,
    OauthModule,
    UsersModule,
    NotesModule,
    TypesModule,
    TagsModule,
    MetricsModule,
    FeedModule,
    PrerenderModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
  ],
})
export class AppModule {}
