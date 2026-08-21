import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';

import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { Note } from './entities/note.entity';
import { TypesModule } from '../types/types.module';
import { TagsModule } from '../tags/tags.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    TypesModule,
    TagsModule,
    UploadsModule,
    TypeOrmModule.forFeature([Note]),
    CacheModule.register({ ttl: 60, max: 200 }),
  ],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
