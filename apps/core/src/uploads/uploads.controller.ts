import {
  Controller,
  Get,
  Param,
  ParseFilePipeBuilder,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { JwtGuard } from '../auth/guards/jwt.guard';
import { UploadsService } from './uploads.service';

// 10 MB — потолок для одного изображения.
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

@Controller('api/v1/uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * Загрузка изображения из редактора заметок. Возвращает ОТНОСИТЕЛЬНЫЙ URL
   * (`/api/v1/uploads/...`), который вставляется в markdown как `![alt](url)`
   * и хранится в БД. Относительный путь host-agnostic: в браузере он
   * разрешается относительно текущего origin (dev/prod/preview), а абсолютный
   * адрес для og:image/JSON-LD достраивается из SITE_URL на этапе рендера меты
   * (см. PrerenderService, PageMeta). Раньше здесь запекался абсолютный URL по
   * хосту запроса — при неверном SITE_URL обложки уходили на http://localhost.
   */
  @UseGuards(JwtGuard)
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^image\/(png|jpe?g|gif|webp|svg\+xml|avif)$/,
        })
        .addMaxSizeValidator({ maxSize: MAX_IMAGE_SIZE })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
  ): Promise<{ url: string; name: string }> {
    const objectName = await this.uploadsService.upload(file);

    return {
      url: `/api/v1/uploads/${objectName}`,
      name: file.originalname,
    };
  }

  /**
   * Публичная раздача изображений (без авторизации — их грузит тег <img>).
   * Проксирует объект из MinIO, чтобы не публиковать сам object store наружу.
   */
  @Get(':key')
  async getImage(
    @Param('key') key: string,
    @Res() res: Response,
  ): Promise<void> {
    const { stream, contentType, size } =
      await this.uploadsService.getObject(key);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', size);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    // Защита от stored-XSS через SVG: запрещаем исполнение скриптов и
    // MIME-sniffing при прямом открытии картинки.
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");

    stream.pipe(res);
  }
}
