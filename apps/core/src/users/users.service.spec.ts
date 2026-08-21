import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException } from '@nestjs/common';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';

jest.mock('../metrics/metrics.provider', () => ({
  createRequestCounter: () => ({ inc: jest.fn() }),
  createRequestDurationHistogram: () => ({
    startTimer: jest.fn(() => jest.fn()),
  }),
}));

const mockUser = (overrides = {}): User =>
  ({
    id: 1,
    email: 'test@example.com',
    status: 'active',
    isActive: true,
    refreshToken: null,
    notes: [],
    ...overrides,
  }) as User;

describe('UsersService', () => {
  let service: UsersService;

  const mockRepo = {
    save: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a user when email does not exist', async () => {
      const user = mockUser();
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.save.mockResolvedValue(user);

      const result = await service.create({ email: 'test@example.com' });

      expect(mockRepo.save).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toBe(user);
    });

    it('throws BadRequestException when email already exists', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser());

      await expect(
        service.create({ email: 'test@example.com' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('returns cached user on hit', async () => {
      const user = mockUser();
      mockCache.get.mockResolvedValue(user);

      const result = await service.findById(1);

      expect(result).toBe(user);
      expect(mockRepo.findOne).not.toHaveBeenCalled();
    });

    it('fetches from DB and caches on miss', async () => {
      const user = mockUser();
      mockCache.get.mockResolvedValue(null);
      mockRepo.findOne.mockResolvedValue(user);

      const result = await service.findById(1);

      expect(result).toBe(user);
      expect(mockCache.set).toHaveBeenCalledWith('users:1', user);
    });

    it('returns null when user not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findOne.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('returns user by email', async () => {
      const user = mockUser();
      mockRepo.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('test@example.com');

      expect(result).toBe(user);
    });
  });

  describe('findByRefreshToken', () => {
    it('returns user by refresh token', async () => {
      const user = mockUser({ refreshToken: 'token123' });
      mockRepo.findOne.mockResolvedValue(user);

      const result = await service.findByRefreshToken('token123');

      expect(result).toBe(user);
    });
  });

  describe('saveRefreshToken', () => {
    it('updates refresh token and invalidates cache', async () => {
      const user = mockUser();
      mockRepo.findOneOrFail.mockResolvedValue(user);
      mockRepo.save.mockResolvedValue({ ...user, refreshToken: 'newToken' });
      mockCache.del.mockResolvedValue(undefined);

      await service.saveRefreshToken(1, 'newToken');

      expect(mockCache.del).toHaveBeenCalledWith('users:1');
    });
  });

  describe('update', () => {
    it('updates user fields and invalidates cache', async () => {
      const user = mockUser();
      mockRepo.findOneOrFail.mockResolvedValue(user);
      mockRepo.save.mockResolvedValue({ ...user, status: 'away' });
      mockCache.del.mockResolvedValue(undefined);

      const result = await service.update(1, {
        status: 'away',
      } as Partial<User>);

      expect(mockCache.del).toHaveBeenCalledWith('users:1');
      expect(result).toMatchObject({ id: 1, email: 'test@example.com' });
    });
  });

  describe('isRefreshTokenValid', () => {
    it('returns true when token is valid', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser({ refreshToken: 'token' }));

      const result = await service.isRefreshTokenValid(1, 'token');

      expect(result).toBe(true);
    });

    it('returns false when token not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await service.isRefreshTokenValid(1, 'bad-token');

      expect(result).toBe(false);
    });

    it('returns false on repository error', async () => {
      mockRepo.findOne.mockRejectedValue(new Error('DB error'));

      const result = await service.isRefreshTokenValid(1, 'token');

      expect(result).toBe(false);
    });
  });
});
