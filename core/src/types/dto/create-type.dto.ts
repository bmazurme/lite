import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTypeDto {
  @IsString({ message: 'Название должно быть строкой' })
  @MinLength(2, { message: 'Название должно содержать минимум 2 символа' })
  @MaxLength(100, { message: 'Название не может превышать 100 символов' })
  name: string;
}
