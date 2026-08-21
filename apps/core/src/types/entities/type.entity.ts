import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Note } from '../../notes/entities/note.entity';

@Entity()
export class Type {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({
    nullable: false,
    length: 100,
  })
  name: string;

  @Column({
    nullable: false,
    length: 7,
    default: '#4aa1f2',
  })
  color: string;

  @OneToMany(() => Note, (note) => note.type)
  notes: Note[];
}
