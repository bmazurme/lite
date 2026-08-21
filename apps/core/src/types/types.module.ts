import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';

import { TypesService } from './types.service';
import { TypesController } from './types.controller';
import { Type } from './entities/type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Type]),
    CacheModule.register({ ttl: 300, max: 100 }),
  ],
  controllers: [TypesController],
  providers: [TypesService],
})
export class TypesModule {}
