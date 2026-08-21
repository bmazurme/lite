import { Test, TestingModule } from '@nestjs/testing';
import { TypesController } from './types.controller';
import { TypesService } from './types.service';
import { Type } from './entities/type.entity';

const mockType = (overrides = {}): Type =>
  ({ id: 1, name: 'Article', ...overrides }) as Type;

describe('TypesController', () => {
  let controller: TypesController;

  const mockTypesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TypesController],
      providers: [{ provide: TypesService, useValue: mockTypesService }],
    }).compile();

    controller = module.get<TypesController>(TypesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create delegates to service', async () => {
    const type = mockType();
    mockTypesService.create.mockResolvedValue(type);

    const result = await controller.create({
      name: 'Article',
      color: '#4aa1f2',
    });

    expect(mockTypesService.create).toHaveBeenCalledWith({
      name: 'Article',
      color: '#4aa1f2',
    });
    expect(result).toBe(type);
  });

  it('findAll delegates to service', async () => {
    const types = [mockType()];
    mockTypesService.findAll.mockResolvedValue(types);

    const result = await controller.findAll();

    expect(result).toBe(types);
  });

  it('findOne delegates to service with numeric id', async () => {
    const type = mockType();
    mockTypesService.findOne.mockResolvedValue(type);

    const result = await controller.findOne('1');

    expect(mockTypesService.findOne).toHaveBeenCalledWith(1);
    expect(result).toBe(type);
  });

  it('update delegates to service', async () => {
    const type = mockType({ name: 'Updated' });
    mockTypesService.update.mockResolvedValue(type);

    const result = await controller.update('1', { name: 'Updated' });

    expect(mockTypesService.update).toHaveBeenCalledWith(1, {
      name: 'Updated',
    });
    expect(result).toBe(type);
  });

  it('remove delegates to service', async () => {
    mockTypesService.remove.mockResolvedValue({
      message: 'Type successfully removed',
    });

    const result = await controller.remove('1');

    expect(mockTypesService.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual({ message: 'Type successfully removed' });
  });
});
