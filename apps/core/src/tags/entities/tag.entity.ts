import { Column, Entity, ManyToMany } from 'typeorm';

import { BaseEntity } from '../../base.entity';
import { Note } from '../../notes/entities/note.entity';

@Entity()
export class Tag extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: false,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 60,
    unique: true,
    nullable: false,
  })
  slug: string;

  @ManyToMany(() => Note, (note) => note.tags)
  notes: Note[];
}
