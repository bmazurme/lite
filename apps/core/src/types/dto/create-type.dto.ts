import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateTypeDto {
  @IsString({ message: 'Название должно быть строкой' })
  @MinLength(2, { message: 'Название должно содержать минимум 2 символа' })
  @MaxLength(100, { message: 'Название не может превышать 100 символов' })
  name: string;

  @IsString({ message: 'Цвет должен быть строкой' })
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: 'Цвет должен быть в формате #rrggbb',
  })
  color: string;
}
