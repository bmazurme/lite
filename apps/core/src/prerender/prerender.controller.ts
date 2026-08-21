import { Controller, Get, Header, Param, Req } from '@nestjs/common';
import type { Request } from 'express';

import { PrerenderService } from './prerender.service';

/**
 * Роуты пререндера. nginx переписывает сюда только запросы соц-скрейперов
 * (по User-Agent) вида /prerender<оригинальный-путь>. Отдаём HTML с корректной
 * OG-разметкой конкретной страницы.
 */
@Controller('prerender')
export class PrerenderController {
  constructor(private readonly prerenderService: PrerenderService) {}

  @Get('n/:slug')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  noteBySlug(@Param('slug') slug: string): Promise<string> {
    return this.prerenderService.noteBySlug(slug);
  }

  @Get('note/:id')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  noteById(@Param('id') id: string): Promise<string> {
    return this.prerenderService.noteById(+id);
  }

  // Всё остальное (главная, списки, теги, поиск) — мета сайта по умолчанию.
  @Get('*')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  fallback(@Req() req: Request): string {
    // req.path вида /prerender/... — вернём исходный путь без префикса.
    const path = req.path.replace(/^\/prerender/, '') || '/';
    return this.prerenderService.home(path);
  }
}
