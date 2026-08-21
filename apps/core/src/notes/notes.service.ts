import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

import { Note } from './entities/note.entity';
import { Type } from '../types/entities/type.entity';
import { User } from '../users/entities/user.entity';

import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { slugify } from './slugify';
import { TagsService } from '../tags/tags.service';
import { UploadsService } from '../uploads/uploads.service';

/** Компактное представление заметки в списке обратных ссылок. */
export type BacklinkRef = Pick<Note, 'id' | 'slug' | 'title'>;

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    private readonly tagsService: TagsService,
    private readonly uploadsService: UploadsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(createNoteDto: CreateNoteDto, user: User) {
    this.logger.log('Creating new note', {
      userId: user.id,
      title: createNoteDto.title,
    });

    try {
      const note = new Note();

      note.title = createNoteDto.title;
      note.preview = createNoteDto.preview;
      note.content = createNoteDto.content;
      note.coverImage = createNoteDto.coverImage || null;
      note.type = createNoteDto.type as Type;
      note.creator = user;
      note.slug = await this.generateUniqueSlug(createNoteDto.title);
      note.tags = await this.tagsService.resolveTags(createNoteDto.tags);
      note.relatedNotes = await this.resolveRelatedNotes(
        createNoteDto.relatedNoteIds,
      );
      note.published = createNoteDto.published ?? false;
      note.reviewedAt = createNoteDto.reviewedAt
        ? new Date(createNoteDto.reviewedAt)
        : null;

      this.logger.debug('Preparing to save new note with data', {
        title: note.title,
        typeId: note.type?.id,
        creatorId: user.id,
        tags: note.tags.length,
      });

      const { id } = await this.noteRepository.save(note);

      this.logger.debug('Note saved successfully', { noteId: id });

      const result = await this.noteRepository.findOne({
        where: { id },
        relations: { type: true, tags: true },
      });

      await this.invalidateAllNotesCache();

      this.logger.log('Note created successfully', {
        noteId: result?.id,
        title: result?.title,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to create note', {
        error: error.message,
        stack: error.stack,
        userId: user.id,
        title: createNoteDto.title,
      });
      throw error;
    }
  }

  async findAll(page: number, includeDrafts = false) {
    this.logger.log('Fetching notes list', { page });

    const key = `notes:page:${page}:${includeDrafts ? 'all' : 'pub'}`;
    const cached = await this.cacheManager.get(key);
    if (cached) return cached;

    const take = 10;
    const skip = (page - 1) * take;

    this.logger.debug('Pagination parameters', { page, take, skip });

    try {
      const [results, total] = await this.noteRepository.findAndCount({
        relations: { type: true, tags: true },
        where: includeDrafts ? {} : { published: true },
        order: { id: 'DESC' },
        take,
        skip,
        select: {
          id: true,
          slug: true,
          title: true,
          preview: true,
          content: true,
          coverImage: true,
          type: true,
          tags: { id: true, name: true, slug: true },
          published: true,
        },
      });

      this.logger.debug('Notes fetched successfully', {
        count: results.length,
        total,
        page,
      });

      const response = { data: results, total };
      await this.cacheManager.set(key, response);
      return response;
    } catch (error) {
      this.logger.error('Failed to fetch notes list', { error, page });
      throw error;
    }
  }

  async findAllByType(typeId: number, page: number, includeDrafts = false) {
    this.logger.log('Fetching notes list by type', { typeId, page });

    const key = `notes:type:${typeId}:page:${page}:${includeDrafts ? 'all' : 'pub'}`;
    const cached = await this.cacheManager.get(key);
    if (cached) return cached;

    const take = 10;
    const skip = (page - 1) * take;

    this.logger.debug('Pagination parameters', { page, take, skip });

    try {
      const where = includeDrafts
        ? { type: { id: typeId } }
        : { type: { id: typeId }, published: true };

      const [results, total] = await this.noteRepository.findAndCount({
        relations: { type: true, tags: true },
        where,
        order: { id: 'DESC' },
        take,
        skip,
        select: {
          id: true,
          slug: true,
          title: true,
          preview: true,
          content: true,
          coverImage: true,
          type: true,
          tags: { id: true, name: true, slug: true },
          published: true,
        },
      });

      this.logger.debug('Notes fetched successfully', {
        count: results.length,
        total,
        page,
      });

      const response = { data: results, total };
      await this.cacheManager.set(key, response);
      return response;
    } catch (error) {
      this.logger.error('Failed to fetch notes list by type', {
        error,
        typeId,
        page,
      });
      throw error;
    }
  }

  async findAllByTag(slug: string, page: number, includeDrafts = false) {
    this.logger.log('Fetching notes list by tag', { slug, page });

    const key = `notes:tag:${slug}:page:${page}:${includeDrafts ? 'all' : 'pub'}`;
    const cached = await this.cacheManager.get(key);
    if (cached) return cached;

    const take = 10;
    const skip = (page - 1) * take;

    try {
      // Фильтр по тегу через подзапрос по join-таблице: так подгрузка всех
      // тегов заметки для отображения не искажает условие фильтрации, а
      // getManyAndCount корректно применяет пагинацию к самим заметкам.
      const qb = this.noteRepository
        .createQueryBuilder('note')
        .leftJoinAndSelect('note.type', 'type')
        .leftJoinAndSelect('note.tags', 'tag')
        .where((qb) => {
          const sub = qb
            .subQuery()
            .select('nt.noteId')
            .from('note_tags', 'nt')
            .innerJoin('tag', 'ft', 'ft.id = nt.tagId')
            .where('ft.slug = :slug')
            .getQuery();
          return `note.id IN ${sub}`;
        })
        .setParameter('slug', slug)
        .orderBy('note.id', 'DESC')
        .skip(skip)
        .take(take);

      if (!includeDrafts) {
        qb.andWhere('note.published = true');
      }

      const [results, total] = await qb.getManyAndCount();

      const response = { data: results, total };
      await this.cacheManager.set(key, response);
      return response;
    } catch (error) {
      this.logger.error('Failed to fetch notes list by tag', {
        error,
        slug,
        page,
      });
      throw error;
    }
  }

  /**
   * Полнотекстовый поиск по заголовку, превью и содержимому.
   * ILIKE как отправная точка; при росте объёма заметок заменить на
   * tsvector-индекс без изменения контракта эндпоинта.
   */
  async search(query: string, page: number, includeDrafts = false) {
    const trimmed = query?.trim() ?? '';

    this.logger.log('Searching notes', { query: trimmed, page });

    if (!trimmed) {
      return { data: [], total: 0 };
    }

    const take = 10;
    const skip = (page - 1) * take;
    const pattern = `%${this.escapeLike(trimmed)}%`;

    try {
      const qb = this.noteRepository
        .createQueryBuilder('note')
        .leftJoinAndSelect('note.type', 'type')
        .leftJoinAndSelect('note.tags', 'tag')
        .where(
          "(note.title ILIKE :pattern ESCAPE '\\' OR note.preview ILIKE :pattern ESCAPE '\\' OR note.content ILIKE :pattern ESCAPE '\\')",
          { pattern },
        )
        .orderBy('note.id', 'DESC')
        .skip(skip)
        .take(take);

      if (!includeDrafts) {
        qb.andWhere('note.published = true');
      }

      const [results, total] = await qb.getManyAndCount();

      this.logger.debug('Search completed', {
        query: trimmed,
        count: results.length,
        total,
      });

      return { data: results, total };
    } catch (error) {
      this.logger.error('Failed to search notes', {
        error,
        query: trimmed,
        page,
      });
      throw error;
    }
  }

  async findOne(id: number, includeDrafts = false) {
    this.logger.log('Fetching note by ID', { id });

    const key = `notes:${id}`;
    const cached: any = await this.cacheManager.get(key);
    if (cached) {
      if (cached.published === false && !includeDrafts) {
        throw new NotFoundException();
      }
      return cached;
    }

    try {
      const document = await this.noteRepository.findOne({
        where: { id },
        relations: { type: true, tags: true, relatedNotes: true },
        select: {
          id: true,
          slug: true,
          title: true,
          preview: true,
          content: true,
          coverImage: true,
          createdAt: true,
          updatedAt: true,
          reviewedAt: true,
          published: true,
          type: { id: true, name: true, color: true },
          tags: { id: true, name: true, slug: true },
          relatedNotes: { id: true, slug: true, title: true },
        },
      });

      if (!document) {
        this.logger.error('Not Found');
        throw new NotFoundException();
      }

      const result = {
        ...document,
        backlinks: await this.findBacklinks(document.title, document.id),
      };

      await this.cacheManager.set(key, result);

      if (result.published === false && !includeDrafts) {
        throw new NotFoundException();
      }

      return result;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to fetch note', { error, id });
      throw error;
    }
  }

  async findBySlug(slug: string, includeDrafts = false) {
    this.logger.log('Fetching note by slug', { slug });

    const key = `notes:slug:${slug}`;
    const cached: any = await this.cacheManager.get(key);
    if (cached) {
      if (cached.published === false && !includeDrafts) {
        throw new NotFoundException();
      }
      return cached;
    }

    try {
      const document = await this.noteRepository.findOne({
        where: { slug },
        relations: { type: true, tags: true, relatedNotes: true },
        select: {
          id: true,
          slug: true,
          title: true,
          preview: true,
          content: true,
          coverImage: true,
          createdAt: true,
          updatedAt: true,
          reviewedAt: true,
          published: true,
          type: { id: true, name: true, color: true },
          tags: { id: true, name: true, slug: true },
          relatedNotes: { id: true, slug: true, title: true },
        },
      });

      if (!document) {
        this.logger.error('Not Found');
        throw new NotFoundException();
      }

      const result = {
        ...document,
        backlinks: await this.findBacklinks(document.title, document.id),
      };

      await this.cacheManager.set(key, result);

      if (result.published === false && !includeDrafts) {
        throw new NotFoundException();
      }

      return result;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to fetch note by slug', { error, slug });
      throw error;
    }
  }

  /** Резолвинг вики-ссылки `[[Заголовок]]` в заметку по её заголовку. */
  async findByTitle(
    title: string,
    includeDrafts = false,
  ): Promise<BacklinkRef> {
    const document = await this.noteRepository
      .createQueryBuilder('note')
      .select(['note.id', 'note.slug', 'note.title', 'note.published'])
      .where('LOWER(note.title) = LOWER(:title)', { title: title.trim() })
      .orderBy('note.id', 'ASC')
      .getOne();

    if (!document || (document.published === false && !includeDrafts)) {
      throw new NotFoundException(`Заметка «${title}» не найдена`);
    }

    return document;
  }

  /**
   * Обратные ссылки: заметки, чьё содержимое ссылается на `title`
   * через `[[title]]` или `[[title|алиас]]`. Вычисляется динамически,
   * поэтому всегда актуально независимо от порядка создания заметок.
   */
  async findBacklinks(
    title: string,
    excludeId?: number,
  ): Promise<BacklinkRef[]> {
    const safe = this.escapeLike(title.trim());

    const qb = this.noteRepository
      .createQueryBuilder('note')
      .select(['note.id', 'note.slug', 'note.title'])
      .where(
        "(note.content ILIKE :exact ESCAPE '\\' OR note.content ILIKE :alias ESCAPE '\\')",
        {
          exact: `%[[${safe}]]%`,
          alias: `%[[${safe}|%`,
        },
      )
      .orderBy('note.id', 'DESC')
      .take(50);

    if (excludeId) {
      qb.andWhere('note.id != :excludeId', { excludeId });
    }

    return qb.getMany();
  }

  /** Экранирование спецсимволов LIKE/ILIKE: `\`, `%`, `_`. */
  private escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, (m) => `\\${m}`);
  }

  /**
   * Резолвинг ID связанных заметок в сущности. Дедуплицирует и отбрасывает
   * ссылку на саму заметку (excludeId), чтобы заметка не могла быть связана
   * сама с собой.
   */
  private async resolveRelatedNotes(
    ids?: number[],
    excludeId?: number,
  ): Promise<Note[]> {
    if (!ids?.length) return [];

    const unique = [...new Set(ids)].filter((id) => id !== excludeId);
    if (!unique.length) return [];

    return this.noteRepository.find({ where: { id: In(unique) } });
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const base = slugify(title);
    let slug = base;
    let n = 2;

    while (await this.noteRepository.count({ where: { slug } })) {
      slug = `${base}-${n++}`;
    }

    return slug;
  }

  async update(id: number, updateNoteDto: UpdateNoteDto): Promise<Note> {
    this.logger.log('Updating note', { id, updateData: updateNoteDto });

    try {
      const existingNote = await this.noteRepository.findOne({
        where: { id },
        relations: {
          type: true,
          tags: true,
          relatedNotes: true,
        },
      });

      if (!existingNote) {
        this.logger.error(`Note with ID ${id} not found`);
        throw new NotFoundException(`Note with ID ${id} not found`);
      }

      if (updateNoteDto.title !== undefined) {
        existingNote.title = updateNoteDto.title;
      }

      if (updateNoteDto.preview !== undefined) {
        existingNote.preview = updateNoteDto.preview;
      }

      if (updateNoteDto.content !== undefined) {
        existingNote.content = updateNoteDto.content;
      }

      if (updateNoteDto.coverImage !== undefined) {
        existingNote.coverImage = updateNoteDto.coverImage || null;
      }

      if (updateNoteDto.type !== undefined) {
        existingNote.type = updateNoteDto.type as Type;
      }

      if (updateNoteDto.tags !== undefined) {
        existingNote.tags = await this.tagsService.resolveTags(
          updateNoteDto.tags,
        );
      }

      if (updateNoteDto.relatedNoteIds !== undefined) {
        existingNote.relatedNotes = await this.resolveRelatedNotes(
          updateNoteDto.relatedNoteIds,
          id,
        );
      }

      if (updateNoteDto.published !== undefined) {
        existingNote.published = updateNoteDto.published;
      }

      if (updateNoteDto.reviewedAt !== undefined) {
        existingNote.reviewedAt = updateNoteDto.reviewedAt
          ? new Date(updateNoteDto.reviewedAt)
          : null;
      }

      const updatedNote = await this.noteRepository.save(existingNote);

      this.logger.debug('Note updated in database', {
        id: updatedNote.id,
      });

      const result = await this.noteRepository.findOne({
        where: { id: updatedNote.id },
        relations: {
          type: true,
          tags: true,
          relatedNotes: true,
        },
        select: {
          id: true,
          title: true,
          preview: true,
          content: true,
          coverImage: true,
          published: true,
          createdAt: true,
          updatedAt: true,
          reviewedAt: true,
          type: {
            id: true,
            name: true,
            color: true,
          },
          tags: { id: true, name: true, slug: true },
          relatedNotes: { id: true, slug: true, title: true },
        },
      });

      this.logger.log('Note updated successfully', {
        id: result?.id,
        title: result?.title,
      });

      await this.invalidateAllNotesCache();

      return result as Note;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to update note', { error, id });
      throw error;
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    this.logger.log('Deleting note', { id });

    try {
      const noteToRemove = await this.noteRepository.findOne({ where: { id } });

      if (!noteToRemove) {
        this.logger.error(`Note with ID ${id} not found for deletion`);
        throw new NotFoundException(`Note with ID ${id} not found`);
      }

      await this.noteRepository.remove(noteToRemove);

      await this.invalidateAllNotesCache();

      // Удаляем загруженные в заметку изображения из object store. Делаем это
      // после удаления из БД (best-effort) — сбой MinIO не должен отменять
      // удаление заметки. Файлы, на которые ещё ссылаются другие заметки, не
      // трогаем.
      const objectNames = this.uploadsService.extractObjectNames(
        noteToRemove.content,
        noteToRemove.preview,
        noteToRemove.coverImage,
      );
      const orphaned = await this.filterUnreferencedObjects(objectNames, id);
      await this.uploadsService.removeMany(orphaned);

      this.logger.log(`Note with ID ${id} successfully deleted`);

      return { message: `Note with ID ${id} has been successfully removed` };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to delete note', { error, id });
      throw error;
    }
  }

  /**
   * Отфильтровывает ключи объектов, на которые ещё ссылается хотя бы одна
   * другая заметка (например, если картинку переиспользовали, скопировав
   * markdown). Такие файлы удалять нельзя — вернутся только «осиротевшие».
   */
  private async filterUnreferencedObjects(
    objectNames: string[],
    excludeNoteId: number,
  ): Promise<string[]> {
    const orphaned: string[] = [];

    for (const name of objectNames) {
      const pattern = `%${this.escapeLike(name)}%`;
      const count = await this.noteRepository
        .createQueryBuilder('note')
        .where('note.id != :excludeNoteId', { excludeNoteId })
        .andWhere(
          "(note.content ILIKE :pattern ESCAPE '\\' OR note.preview ILIKE :pattern ESCAPE '\\' OR note.\"coverImage\" ILIKE :pattern ESCAPE '\\')",
          { pattern },
        )
        .getCount();

      if (count === 0) {
        orphaned.push(name);
      }
    }

    return orphaned;
  }

  /**
   * Сбрасывает весь кэш заметок (списки и карточки). Полная инвалидация
   * нужна потому, что обратные ссылки одной заметки зависят от содержимого
   * других, а фильтры по тегам/типам кэшируются постранично.
   */
  private async invalidateAllNotesCache(): Promise<void> {
    const store = (this.cacheManager as any).store;
    if (typeof store?.keys !== 'function') return;

    const keys: string[] = await store.keys();
    const toDelete = keys.filter((k: string) => k.startsWith('notes:'));
    await Promise.all(toDelete.map((k: string) => this.cacheManager.del(k)));
  }
}
