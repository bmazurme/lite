import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';

import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { User } from '../users/entities/user.entity';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';

@Controller('api/v1/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @UseGuards(JwtGuard)
  @Post()
  create(@Body() createNoteDto: CreateNoteDto, @CurrentUser() user: User) {
    return this.notesService.create(createNoteDto, user);
  }

  @UseGuards(OptionalJwtGuard)
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string, @CurrentUser() user: unknown) {
    return this.notesService.findBySlug(slug, !!user);
  }

  @UseGuards(OptionalJwtGuard)
  @Get('by-title/:title')
  findByTitle(@Param('title') title: string, @CurrentUser() user: unknown) {
    return this.notesService.findByTitle(title, !!user);
  }

  @UseGuards(OptionalJwtGuard)
  @Get('search')
  search(
    @Query('q') q: string = '',
    @Query('page') page: string = '1',
    @CurrentUser() user: unknown,
  ) {
    return this.notesService.search(q, +page, !!user);
  }

  @UseGuards(OptionalJwtGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: unknown) {
    return this.notesService.findOne(+id, !!user);
  }

  @UseGuards(OptionalJwtGuard)
  @Get('pages/:page')
  findAll(@Param('page') page: string, @CurrentUser() user: unknown) {
    return this.notesService.findAll(+page, !!user);
  }

  @UseGuards(OptionalJwtGuard)
  @Get('type/:typeId/pages/:page')
  findAllByType(
    @Param('page') page: string,
    @Param('typeId') typeId: string,
    @CurrentUser() user: unknown,
  ) {
    return this.notesService.findAllByType(+typeId, +page, !!user);
  }

  @UseGuards(OptionalJwtGuard)
  @Get('tag/:slug/pages/:page')
  findAllByTag(
    @Param('page') page: string,
    @Param('slug') slug: string,
    @CurrentUser() user: unknown,
  ) {
    return this.notesService.findAllByTag(slug, +page, !!user);
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto) {
    return this.notesService.update(+id, updateNoteDto);
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notesService.remove(+id);
  }
}
