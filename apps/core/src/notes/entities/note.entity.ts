import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
// Обратные ссылки (backlinks) вычисляются динамически по содержимому заметок
// (см. NotesService.findBacklinks). Связанные заметки (relatedNotes), в
// отличие от них, — явная связь note→note, которую автор выбирает вручную.

import { BaseEntity } from '../../base.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Type } from '../../types/entities/type.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Note extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 150,
    nullable: false,
    default: 'Без названия',
  })
  title: string;

  @Column({
    type: 'varchar',
    length: 180,
    unique: true,
    nullable: true,
  })
  slug: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  preview: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  content: string;

  /** Абсолютный URL обложки (og:image / twitter:image). Необязателен. */
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  coverImage: string | null;

  /** Черновик виден только авторизованному автору; публичным — только после публикации. */
  @Column({
    type: 'boolean',
    default: true,
    nullable: false,
  })
  published: boolean;

  /**
   * Дата последней «проверки» — момент, когда автор вручную подтвердил, что
   * содержимое всё ещё актуально (кнопка «Проверено» в редакторе). В отличие
   * от updatedAt, не меняется при обычной правке. null — заметку ещё не сверяли.
   */
  @Column({
    type: 'timestamp',
    nullable: true,
  })
  reviewedAt: Date | null;

  @ManyToOne(() => Type, (type) => type.notes, {
    nullable: false,
  })
  @JoinColumn({ name: 'typeId' })
  type: Type;

  @ManyToMany(() => Tag, (tag) => tag.notes)
  @JoinTable({
    name: 'note_tags',
    joinColumn: { name: 'noteId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @ManyToMany(() => Note)
  @JoinTable({
    name: 'note_related_notes',
    joinColumn: { name: 'noteId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'relatedNoteId', referencedColumnName: 'id' },
  })
  relatedNotes: Note[];

  @ManyToOne(() => User, (user) => user.notes, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'creatorId' }) // Название колонки в БД
  creator: User;
}
