import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { configureCors } from './config/cors.config';
import { swaggerConfig } from './config/swagger.config';
import { winstonConfig } from './config/logger.config';

async function bootstrap() {
  const logger = WinstonModule.createLogger(winstonConfig);

  const app = await NestFactory.create(AppModule, { logger });

  const configService = app.get(ConfigService);

  app.use(cookieParser());
  app.use(compression());
  app.use(helmet());

  configureCors(app);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  if (configService.get<string>('NODE_ENV') === 'development') {
    const documentFactory = () =>
      SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, documentFactory);
  }

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`, 'Bootstrap');
}
bootstrap();
