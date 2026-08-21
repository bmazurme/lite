import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TypeIdDto {
  @ApiProperty({ description: 'ID связанного блока', example: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  id: number;
}
