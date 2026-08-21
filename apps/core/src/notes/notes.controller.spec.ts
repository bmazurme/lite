import { Test, TestingModule } from '@nestjs/testing';

import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { Note } from './entities/note.entity';

const mockNote = (overrides = {}): Note =>
  ({
    id: 1,
    title: 'Test',
    preview: 'p',
    content: 'c',
    type: { id: 1, name: 'Article' },
    ...overrides,
  }) as Note;

describe('NotesController', () => {
  let controller: NotesController;

  const mockNotesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllByType: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [{ provide: NotesService, useValue: mockNotesService }],
    }).compile();

    controller = module.get<NotesController>(NotesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create delegates to service', async () => {
    const note = mockNote();
    const dto = {
      title: 'Test',
      preview: 'p',
      content: 'c',
      type: { id: 1 },
    } as any;
    const user = { id: 1 } as any;
    mockNotesService.create.mockResolvedValue(note);

    const result = await controller.create(dto, user);

    expect(mockNotesService.create).toHaveBeenCalledWith(dto, user);
    expect(result).toBe(note);
  });

  it('findOne delegates to service with numeric id, includeDrafts false when anonymous', async () => {
    const note = mockNote();
    mockNotesService.findOne.mockResolvedValue(note);

    const result = await controller.findOne('1', undefined);

    expect(mockNotesService.findOne).toHaveBeenCalledWith(1, false);
    expect(result).toBe(note);
  });

  it('findOne passes includeDrafts true when a user is present', async () => {
    const note = mockNote();
    mockNotesService.findOne.mockResolvedValue(note);

    await controller.findOne('1', { userId: 1 });

    expect(mockNotesService.findOne).toHaveBeenCalledWith(1, true);
  });

  it('findAll delegates to service with numeric page', async () => {
    const data = { data: [mockNote()], total: 1 };
    mockNotesService.findAll.mockResolvedValue(data);

    const result = await controller.findAll('2', undefined);

    expect(mockNotesService.findAll).toHaveBeenCalledWith(2, false);
    expect(result).toBe(data);
  });

  it('findAllByType delegates to service', async () => {
    const data = { data: [mockNote()], total: 1 };
    mockNotesService.findAllByType.mockResolvedValue(data);

    const result = await controller.findAllByType('1', '3', undefined);

    expect(mockNotesService.findAllByType).toHaveBeenCalledWith(3, 1, false);
    expect(result).toBe(data);
  });

  it('update delegates to service', async () => {
    const note = mockNote({ title: 'Updated' });
    mockNotesService.update.mockResolvedValue(note);

    const result = await controller.update('1', { title: 'Updated' } as any);

    expect(mockNotesService.update).toHaveBeenCalledWith(1, {
      title: 'Updated',
    });
    expect(result).toBe(note);
  });

  it('remove delegates to service', async () => {
    mockNotesService.remove.mockResolvedValue({ message: 'removed' });

    const result = await controller.remove('1');

    expect(mockNotesService.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual({ message: 'removed' });
  });
});
