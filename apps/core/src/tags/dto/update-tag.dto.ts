import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateTagDto {
  @IsString({ message: 'Название должно быть строкой' })
  @MinLength(1, { message: 'Название не может быть пустым' })
  @MaxLength(50, { message: 'Название не может превышать 50 символов' })
  name: string;
}
