import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe', () => {
    it('returns user profile as MeResponseDto', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        status: 'active',
      } as any;
      mockUsersService.findById.mockResolvedValue(user);

      const result = await controller.getMe({ id: 1 });

      expect(mockUsersService.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        id: 1,
        username: 'test@example.com',
        status: 'active',
      });
    });

    it('throws NotFoundException when user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(controller.getMe({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates own profile', async () => {
      const response = { id: 1, email: 'test@example.com', status: 'away' };
      mockUsersService.update.mockResolvedValue(response);

      const result = await controller.update(1, { status: 'away' } as any, {
        id: 1,
      });

      expect(mockUsersService.update).toHaveBeenCalledWith(1, {
        status: 'away',
      });
      expect(result).toBe(response);
    });

    it('throws ForbiddenException when updating another user', async () => {
      await expect(
        controller.update(2, { status: 'away' } as any, { id: 1 }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockUsersService.update).not.toHaveBeenCalled();
    });
  });
});
