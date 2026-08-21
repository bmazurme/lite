import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from '../users/entities/user.entity';
import { Note } from '../notes/entities/note.entity';
import { Type } from '../types/entities/type.entity';
import { Tag } from '../tags/entities/tag.entity';

export const TypeOrmModuleConfig = TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => {
    const isDev = configService.get('NODE_ENV') !== 'production';

    return {
      type: 'postgres',
      host: configService.get('POSTGRES_HOST') ?? 'localhost',
      port: +configService.get('POSTGRES_PORT') || 5432,
      username: configService.get('POSTGRES_USER') ?? 'postgres',
      password: configService.get('POSTGRES_PASSWORD') ?? 'newPassword',
      database: configService.get('POSTGRES_DB_NOTES') ?? 'notes-db',
      entities: [User, Note, Type, Tag],
      synchronize: isDev,
      migrations: isDev ? [] : ['dist/migrations/*.js'],
      migrationsRun: !isDev,
    };
  },
  inject: [ConfigService],
});
