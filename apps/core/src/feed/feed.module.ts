import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { Note } from '../notes/entities/note.entity';
import { Type } from '../types/entities/type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Note, Type])],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
