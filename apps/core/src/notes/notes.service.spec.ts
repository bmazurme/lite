import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';

import { NotesService } from './notes.service';
import { Note } from './entities/note.entity';
import { TagsService } from '../tags/tags.service';
import { UploadsService } from '../uploads/uploads.service';

jest.mock('../metrics/metrics.provider', () => ({
  createRequestCounter: () => ({ inc: jest.fn() }),
  createRequestDurationHistogram: () => ({
    startTimer: jest.fn(() => jest.fn()),
  }),
}));

const mockNote = (overrides = {}): Note =>
  ({
    id: 1,
    title: 'Test',
    preview: 'preview',
    content: 'content',
    type: { id: 1, name: 'Article' },
    creator: { id: 1 },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Note;

describe('NotesService', () => {
  let service: NotesService;

  const mockQb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getCount: jest.fn().mockResolvedValue(0),
    getRawAndEntities: jest.fn().mockResolvedValue({ entities: [], raw: [] }),
  };

  const mockRepo = {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQb),
  };

  const mockTagsService = {
    resolveTags: jest.fn().mockResolvedValue([]),
    findAll: jest.fn(),
    findBySlug: jest.fn(),
  };

  const mockUploadsService = {
    extractObjectNames: jest.fn().mockReturnValue([]),
    removeMany: jest.fn().mockResolvedValue(undefined),
  };

  const mockStoreKeys = jest.fn();

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    store: { keys: mockStoreKeys },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: getRepositoryToken(Note), useValue: mockRepo },
        { provide: TagsService, useValue: mockTagsService },
        { provide: UploadsService, useValue: mockUploadsService },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns cached value on cache hit', async () => {
      const cached = { data: [mockNote()], total: 1 };
      mockCache.get.mockResolvedValue(cached);

      const result = await service.findAll(1);

      expect(result).toBe(cached);
      expect(mockRepo.findAndCount).not.toHaveBeenCalled();
    });

    it('fetches from DB, caches, and returns on miss', async () => {
      const notes = [mockNote()];
      mockCache.get.mockResolvedValue(null);
      mockRepo.findAndCount.mockResolvedValue([notes, 1]);

      const result = await service.findAll(1);

      expect(result).toEqual({ data: notes, total: 1 });
      expect(mockCache.set).toHaveBeenCalledWith('notes:page:1:pub', {
        data: notes,
        total: 1,
      });
    });
  });

  describe('findAllByType', () => {
    it('returns cached value on cache hit', async () => {
      const cached = { data: [mockNote()], total: 1 };
      mockCache.get.mockResolvedValue(cached);

      const result = await service.findAllByType(2, 1);

      expect(result).toBe(cached);
      expect(mockRepo.findAndCount).not.toHaveBeenCalled();
    });

    it('fetches from DB with typeId filter on miss', async () => {
      const notes = [mockNote()];
      mockCache.get.mockResolvedValue(null);
      mockRepo.findAndCount.mockResolvedValue([notes, 1]);

      const result = await service.findAllByType(2, 1);

      expect(result).toEqual({ data: notes, total: 1 });
      expect(mockCache.set).toHaveBeenCalledWith(
        'notes:type:2:page:1:pub',
        expect.any(Object),
      );
    });
  });

  describe('findOne', () => {
    it('returns cached note on hit', async () => {
      const note = mockNote();
      mockCache.get.mockResolvedValue(note);

      const result = await service.findOne(1);

      expect(result).toBe(note);
      expect(mockRepo.findOne).not.toHaveBeenCalled();
    });

    it('fetches from DB and caches on miss', async () => {
      const note = mockNote();
      mockCache.get.mockResolvedValue(null);
      mockRepo.findOne.mockResolvedValue(note);

      const result = await service.findOne(1);

      expect(result).toEqual({ ...note, backlinks: [] });
      expect(mockCache.set).toHaveBeenCalledWith(
        'notes:1',
        expect.objectContaining({ id: note.id, backlinks: [] }),
      );
    });

    it('throws NotFoundException when note not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('saves note and invalidates list cache', async () => {
      const note = mockNote();
      const user = { id: 1 } as any;
      const dto = {
        title: 'Test',
        preview: 'p',
        content: 'c',
        type: { id: 1 },
      } as any;

      mockRepo.save.mockResolvedValue({ id: 1 });
      mockRepo.findOne.mockResolvedValue(note);
      mockStoreKeys.mockResolvedValue(['notes:page:1', 'notes:type:2:page:1']);

      const result = await service.create(dto, user);

      expect(mockRepo.save).toHaveBeenCalled();
      expect(result).toBe(note);
    });
  });

  describe('update', () => {
    it('updates note and invalidates cache', async () => {
      const existing = mockNote();
      const updated = mockNote({ title: 'Updated' });

      mockRepo.findOne
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(updated);
      mockRepo.save.mockResolvedValue(updated);
      mockCache.del.mockResolvedValue(undefined);
      mockStoreKeys.mockResolvedValue(['notes:page:1', 'notes:type:2:page:1']);

      const result = await service.update(1, { title: 'Updated' } as any);

      // Полная инвалидация кэша: удаляются все ключи с префиксом notes:
      expect(mockCache.del).toHaveBeenCalledWith('notes:page:1');
      expect(mockCache.del).toHaveBeenCalledWith('notes:type:2:page:1');
      expect(result).toBe(updated);
    });

    it('throws NotFoundException when note not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('removes note and invalidates cache', async () => {
      const note = mockNote();
      mockRepo.findOne.mockResolvedValue(note);
      mockRepo.remove.mockResolvedValue(undefined);
      mockCache.del.mockResolvedValue(undefined);
      mockStoreKeys.mockResolvedValue(['notes:page:1']);

      const result = await service.remove(1);

      expect(mockRepo.remove).toHaveBeenCalledWith(note);
      expect(mockCache.del).toHaveBeenCalledWith('notes:page:1');
      expect(result).toEqual({ message: expect.stringContaining('1') });
    });

    it('throws NotFoundException when note not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
