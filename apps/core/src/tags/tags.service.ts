import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { UpdateTagDto } from './dto/update-tag.dto';
import { Tag } from './entities/tag.entity';
import { slugify } from '../notes/slugify';

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  /** Список всех тегов с количеством связанных заметок. */
  async findAll(): Promise<Array<Tag & { count: number }>> {
    const rows = await this.tagRepository
      .createQueryBuilder('tag')
      .leftJoin('tag.notes', 'note')
      .select('tag.id', 'id')
      .addSelect('tag.name', 'name')
      .addSelect('tag.slug', 'slug')
      .addSelect('COUNT(note.id)', 'count')
      .groupBy('tag.id')
      .orderBy('tag.name', 'ASC')
      .getRawMany<{ id: number; name: string; slug: string; count: string }>();

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      count: Number(r.count),
    })) as Array<Tag & { count: number }>;
  }

  /**
   * Переименовывает тег: нормализует имя, пересчитывает slug и проверяет,
   * что тег с таким же slug'ом ещё не существует. Связи с заметками
   * (note_tags) при этом сохраняются — меняется только сам тег.
   */
  async update(id: number, dto: UpdateTagDto): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException(`Тег с id ${id} не найден`);
    }

    const name = (dto.name ?? '').trim().replace(/\s+/g, ' ');
    if (!name) {
      throw new ConflictException('Название тега не может быть пустым');
    }

    const slug = slugify(name).slice(0, 60);
    const conflict = await this.tagRepository.findOne({ where: { slug } });
    if (conflict && conflict.id !== id) {
      throw new ConflictException(`Тег «${name}» уже существует`);
    }

    tag.name = name.slice(0, 50);
    tag.slug = slug;
    await this.tagRepository.save(tag);
    this.logger.log(`Tag updated - id: ${id}`);

    return tag;
  }

  /**
   * Удаляет тег. Предварительно вычищает строки в связующей таблице
   * note_tags, чтобы не нарушить внешние ключи (у заметок тег просто
   * пропадает из списка).
   */
  async remove(id: number): Promise<{ message: string }> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException(`Тег с id ${id} не найден`);
    }

    await this.tagRepository.manager
      .createQueryBuilder()
      .delete()
      .from('note_tags')
      .where('"tagId" = :id', { id })
      .execute();

    await this.tagRepository.delete(id);
    this.logger.log(`Tag removed - id: ${id}`);

    return { message: 'Tag successfully removed' };
  }

  async findBySlug(slug: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { slug } });
    if (!tag) {
      throw new NotFoundException(`Тег «${slug}» не найден`);
    }
    return tag;
  }

  /**
   * Находит существующие теги по именам, отсутствующие — создаёт.
   * Имена нормализуются (обрезка пробелов), дедуплицируются по slug.
   */
  async resolveTags(names?: string[]): Promise<Tag[]> {
    if (!names?.length) return [];

    // Нормализация: обрезка пробелов, схлопывание внутренних пробелов,
    // отбрасывание пустых, дедупликация по slug.
    const bySlug = new Map<string, string>();
    for (const raw of names) {
      const name = (raw ?? '').trim().replace(/\s+/g, ' ');
      if (!name) continue;
      const slug = slugify(name);
      if (!bySlug.has(slug)) bySlug.set(slug, name);
    }

    if (bySlug.size === 0) return [];

    const slugs = [...bySlug.keys()];
    const existing = await this.tagRepository.find({
      where: { slug: In(slugs) },
    });
    const existingBySlug = new Map(existing.map((t) => [t.slug, t]));

    const toCreate: Tag[] = [];
    for (const [slug, name] of bySlug) {
      if (existingBySlug.has(slug)) continue;
      const tag = new Tag();
      tag.name = name.slice(0, 50);
      tag.slug = slug.slice(0, 60);
      toCreate.push(tag);
    }

    if (toCreate.length) {
      try {
        const saved = await this.tagRepository.save(toCreate);
        for (const tag of saved) existingBySlug.set(tag.slug, tag);
      } catch (error) {
        // Возможна гонка (тег создан параллельным запросом) — перечитываем.
        this.logger.warn('Failed to create tags, re-fetching', {
          error: error.message,
        });
        const refetched = await this.tagRepository.find({
          where: { slug: In(slugs) },
        });
        for (const tag of refetched) existingBySlug.set(tag.slug, tag);
      }
    }

    return slugs
      .map((slug) => existingBySlug.get(slug))
      .filter((t): t is Tag => Boolean(t));
  }
}
