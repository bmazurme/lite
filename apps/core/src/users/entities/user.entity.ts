import { Column, Entity, OneToMany } from 'typeorm';

import { BaseEntity } from '../../base.entity';
import { Note } from '../../notes/entities/note.entity';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Column({ type: 'boolean', default: false, nullable: false })
  isActive: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  status: string;

  @OneToMany(() => Note, (note) => note.creator)
  notes: Note[];

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  refreshToken: string;
}
