/**
 * Базовый абстрактный класс для всех сущностей TypeORM
 * Содержит общие поля, которые присутствуют в каждой сущности
 *
 * @abstract
 * @class BaseEntity
 * @category Entities
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Абстрактная базовая сущность, содержащая общие поля для всех моделей
 *
 * @abstract
 * @property {number} id - Уникальный идентификатор записи
 * @property {Date} createdAt - Дата создания записи
 * @property {Date} updatedAt - Дата последнего обновления записи
 */
@Entity()
export abstract class BaseEntity {
  /**
   * Уникальный идентификатор сущности
   * Автоматически генерируется базой данных
   * Тип: целое число без знака
   *
   * @type {number}
   */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  /**
   * Дата создания записи
   * Автоматически устанавливается при создании
   *
   * @type {Date}
   */
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  /**
   * Дата последнего обновления записи
   * Автоматически обновляется при каждом изменении
   *
   * @type {Date}
   */
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
