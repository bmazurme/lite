import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException } from '@nestjs/common';

import { TypesService } from './types.service';
import { Type } from './entities/type.entity';

jest.mock('../metrics/metrics.provider', () => ({
  createRequestCounter: () => ({ inc: jest.fn() }),
  createRequestDurationHistogram: () => ({
    startTimer: jest.fn(() => jest.fn()),
  }),
}));

const mockType = (overrides = {}): Type =>
  ({
    id: 1,
    name: 'Article',
    color: '#4aa1f2',
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Type;

describe('TypesService', () => {
  let service: TypesService;

  const mockQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawAndEntities: jest.fn(),
  };

  const mockRepo = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypesService,
        { provide: getRepositoryToken(Type), useValue: mockRepo },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    service = module.get<TypesService>(TypesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns cached value on hit', async () => {
      const cached = [mockType()];
      mockCache.get.mockResolvedValue(cached);

      const result = await service.findAll();

      expect(result).toBe(cached);
      expect(mockRepo.find).not.toHaveBeenCalled();
    });

    it('fetches from DB and caches on miss', async () => {
      const types = [mockType()];
      mockCache.get.mockResolvedValue(null);
      mockQueryBuilder.getRawAndEntities.mockResolvedValue({
        entities: types,
        raw: [],
      });

      const result = await service.findAll();

      expect(result).toBe(types);
      expect(mockCache.set).toHaveBeenCalledWith('types:all', types);
    });
  });

  describe('findOne', () => {
    it('returns cached value on hit', async () => {
      const type = mockType();
      mockCache.get.mockResolvedValue(type);

      const result = await service.findOne(1);

      expect(result).toBe(type);
      expect(mockRepo.findOne).not.toHaveBeenCalled();
    });

    it('fetches from DB and caches on miss', async () => {
      const type = mockType();
      mockCache.get.mockResolvedValue(null);
      mockRepo.findOne.mockResolvedValue(type);

      const result = await service.findOne(1);

      expect(result).toBe(type);
      expect(mockCache.set).toHaveBeenCalledWith('types:1', type);
    });

    it('returns null when type not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('saves type and invalidates list cache', async () => {
      const type = mockType();
      mockRepo.save.mockResolvedValue({ id: 1 });
      mockRepo.findOne.mockResolvedValue(type);
      mockCache.del.mockResolvedValue(undefined);

      const result = await service.create({
        name: 'Article',
        color: '#4aa1f2',
      });

      expect(mockRepo.save).toHaveBeenCalled();
      expect(mockCache.del).toHaveBeenCalledWith('types:all');
      expect(result).toBe(type);
    });
  });

  describe('update', () => {
    it('updates type and invalidates cache', async () => {
      const existing = mockType();
      mockRepo.findOneOrFail.mockResolvedValue(existing);
      mockRepo.save.mockResolvedValue(existing);
      mockCache.del.mockResolvedValue(undefined);

      await service.update(1, { name: 'Updated' });

      expect(mockCache.del).toHaveBeenCalledWith('types:all');
      expect(mockCache.del).toHaveBeenCalledWith('types:1');
    });

    it('throws when type not found', async () => {
      mockRepo.findOneOrFail.mockRejectedValue(new Error('Not found'));

      await expect(service.update(999, { name: 'x' })).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('removes type and invalidates cache', async () => {
      const type = mockType();
      mockRepo.findOneBy.mockResolvedValue(type);
      mockRepo.remove.mockResolvedValue(undefined);
      mockCache.del.mockResolvedValue(undefined);

      const result = await service.remove(1);

      expect(mockRepo.remove).toHaveBeenCalledWith(type);
      expect(mockCache.del).toHaveBeenCalledWith('types:all');
      expect(mockCache.del).toHaveBeenCalledWith('types:1');
      expect(result).toEqual({ message: 'Type successfully removed' });
    });

    it('throws BadRequestException when type not found', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(BadRequestException);
    });
  });
});
