import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

import { Type } from './entities/type.entity';

import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';

import { createRequestDurationHistogram } from '../metrics/metrics.provider';

@Injectable()
export class TypesService {
  private readonly logger = new Logger(TypesService.name);

  private typesFindDuration = createRequestDurationHistogram(
    'types_find_duration_seconds',
    'Duration of types find operations in seconds',
  );

  constructor(
    @InjectRepository(Type)
    private readonly typeRepository: Repository<Type>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(createTypeDto: CreateTypeDto) {
    const type = new Type();
    type.name = createTypeDto.name;
    type.color = createTypeDto.color;

    const { id } = await this.typeRepository.save(type);
    await this.cacheManager.del('types:all');

    return this.typeRepository.findOne({ where: { id } });
  }

  async findAll() {
    const cached = await this.cacheManager.get<Type[]>('types:all');
    if (cached) return cached;

    const result = await this.typeRepository
      .createQueryBuilder('type')
      .leftJoin('type.notes', 'notes')
      .addSelect('COUNT(notes.id)', 'notesCount')
      .groupBy('type.id')
      .orderBy('notesCount', 'DESC')
      .getRawAndEntities();

    const sortedEntities = result.entities;

    await this.cacheManager.set('types:all', sortedEntities);
    return sortedEntities;
  }

  async findOne(id: number) {
    const key = `types:${id}`;
    const cached = await this.cacheManager.get<Type>(key);
    if (cached) return cached;

    const result = await this.typeRepository.findOne({ where: { id } });
    if (result) await this.cacheManager.set(key, result);
    return result;
  }

  async update(id: number, updateTypeDto: UpdateTypeDto) {
    const end = this.typesFindDuration.startTimer({ operation: 'update' });

    try {
      const existingType = await this.typeRepository.findOneOrFail({
        where: { id },
      });
      const updatedType = { ...existingType, ...updateTypeDto };

      await this.typeRepository.save(updatedType);
      await Promise.all([
        this.cacheManager.del('types:all'),
        this.cacheManager.del(`types:${id}`),
      ]);
      this.logger.log(`Type updated - id: ${id}`);

      return updatedType;
    } catch (error) {
      this.logger.error(`Update type error - id: ${id}`, error);
      throw error;
    } finally {
      end();
    }
  }

  async remove(id: number) {
    const end = this.typesFindDuration.startTimer({ operation: 'remove' });

    try {
      const type = await this.typeRepository.findOneBy({ id });

      if (!type) {
        throw new BadRequestException(`Type with id ${id} not found`);
      }

      await this.typeRepository.remove(type);
      await Promise.all([
        this.cacheManager.del('types:all'),
        this.cacheManager.del(`types:${id}`),
      ]);
      this.logger.log(`Type removed - id: ${id}`);

      return { message: 'Type successfully removed' };
    } catch (error) {
      this.logger.error(`Remove type error - id: ${id}`, error);
      throw error;
    } finally {
      end();
    }
  }
}
