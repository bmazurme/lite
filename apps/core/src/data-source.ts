import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

import { User } from './users/entities/user.entity';
import { Note } from './notes/entities/note.entity';
import { Type } from './types/entities/type.entity';
import { Tag } from './tags/entities/tag.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: +(process.env.POSTGRES_PORT ?? '5432'),
  username: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? 'newPassword',
  database: process.env.POSTGRES_DB_NOTES ?? 'notes-db',
  entities: [User, Note, Type, Tag],
  migrations: ['src/migrations/*.ts'],
});
