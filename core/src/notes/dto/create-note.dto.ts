import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

import { TypeIdDto } from '../../types/dto/type-id.dto';

export class CreateNoteDto {
  @IsString({ message: 'Название должно быть строкой' })
  @MinLength(3, { message: 'Название должно содержать минимум 3 символа' })
  @MaxLength(150, { message: 'Название не может превышать 150 символов' })
  title: string;

  @IsString({ message: 'Название должно быть строкой' })
  preview: string;

  @IsString({ message: 'Название должно быть строкой' })
  content: string;

  /** Абсолютный URL обложки (og:image). Пустая строка снимает обложку. */
  @IsOptional()
  @IsString({ message: 'Обложка должна быть строкой' })
  @MaxLength(500, {
    message: 'Ссылка на обложку не может превышать 500 символов',
  })
  coverImage?: string;

  @Type(() => TypeIdDto)
  @IsObject({ message: 'Тип документа должен быть объектом' })
  @IsNotEmpty({ message: 'Тип документа обязателен для указания' })
  type: TypeIdDto;

  @IsOptional()
  @IsArray({ message: 'Теги должны быть массивом' })
  @ArrayMaxSize(30, { message: 'Не более 30 тегов на заметку' })
  @IsString({ each: true, message: 'Каждый тег должен быть строкой' })
  @MaxLength(50, { each: true, message: 'Тег не может превышать 50 символов' })
  tags?: string[];

  @IsOptional()
  @IsArray({ message: 'Связанные заметки должны быть массивом' })
  @ArrayMaxSize(20, { message: 'Не более 20 связанных заметок' })
  @IsInt({ each: true, message: 'ID связанной заметки должен быть числом' })
  relatedNoteIds?: number[];

  /** Черновик (false) виден только автору; публикуется явно. */
  @IsOptional()
  @IsBoolean({ message: 'Признак публикации должен быть булевым' })
  published?: boolean;

  /**
   * Дата последней проверки актуальности (ISO-строка) либо null, чтобы снять
   * отметку. undefined — поле не трогаем.
   */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString({}, { message: 'Дата проверки должна быть корректной датой' })
  reviewedAt?: string | null;
}
