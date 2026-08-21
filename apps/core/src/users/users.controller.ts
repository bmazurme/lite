import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { MeResponseDto } from './dto/me-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(
    @CurrentUser() currentUser: { id: number },
  ): Promise<MeResponseDto> {
    const user = await this.usersService.findById(currentUser.id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return MeResponseDto.fromUser(user);
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: { id: number },
  ) {
    if (id !== currentUser.id) {
      throw new ForbiddenException();
    }

    return this.usersService.update(id, updateUserDto);
  }
}
