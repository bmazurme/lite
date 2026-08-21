import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Notes')
  .setDescription('The place API description')
  .setVersion('1.0')
  .addTag('notes')
  .build();
