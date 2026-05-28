import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
// import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Tools')
  .setDescription('The place API description')
  .setVersion('1.0')
  .addTag('tools')
  .build();

export const configureCors = (app: INestApplication) => {
  app.enableCors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 3600,
    optionsSuccessStatus: 204,
  });
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  configureCors(app);

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(3000);
}
bootstrap();
