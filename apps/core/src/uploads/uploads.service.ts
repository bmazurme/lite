import { randomUUID } from 'crypto';
import { extname } from 'path';

import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import type { Readable } from 'stream';

/**
 * Обёртка над MinIO (S3-совместимый object store). Хранит загруженные
 * пользователем изображения. Загрузка защищена JWT (см. контроллер), а
 * раздача идёт через backend-прокси, поэтому сам MinIO не нужно публиковать
 * наружу — достаточно доступа из сети приложения.
 */
@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly logger = new Logger(UploadsService.name);
  private readonly client: MinioClient;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket =
      this.configService.get<string>('MINIO_BUCKET_NOTES') ?? 'notes-images';

    this.client = new MinioClient({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT') ?? 'localhost',
      port: +(this.configService.get<string>('MINIO_PORT') ?? 9000),
      useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
      accessKey:
        this.configService.get<string>('MINIO_ACCESS_KEY') ?? 'minioadmin',
      secretKey:
        this.configService.get<string>('MINIO_SECRET_KEY') ?? 'minioadmin',
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Created MinIO bucket "${this.bucket}"`);
      }
    } catch (error) {
      // Не валим приложение: MinIO может быть временно недоступен на старте.
      // Ошибка всплывёт при первой загрузке.
      this.logger.error(
        `Failed to ensure MinIO bucket "${this.bucket}": ${(error as Error).message}`,
      );
    }
  }

  /**
   * Загружает файл в MinIO и возвращает сгенерированный ключ объекта.
   * Имя рандомизируется, расширение берётся из исходного имени файла.
   */
  async upload(file: Express.Multer.File): Promise<string> {
    const ext = extname(file.originalname).toLowerCase();
    const objectName = `${randomUUID()}${ext}`;

    try {
      await this.client.putObject(
        this.bucket,
        objectName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype },
      );
    } catch (error) {
      this.logger.error(`MinIO upload failed: ${(error as Error).message}`);
      throw new InternalServerErrorException(
        'Не удалось загрузить изображение',
      );
    }

    return objectName;
  }

  /**
   * Извлекает имена объектов (ключи) из текста заметки — по ссылкам вида
   * `.../api/v1/uploads/<key>`. Хост игнорируется, поэтому работает и с
   * абсолютными, и с относительными URL. Внешние картинки (вставленные по
   * произвольной ссылке) под шаблон не попадают и не трогаются.
   */
  extractObjectNames(...texts: Array<string | null | undefined>): string[] {
    const re = /\/api\/v1\/uploads\/([A-Za-z0-9._-]+)/g;
    const names = new Set<string>();

    for (const text of texts) {
      if (!text) continue;
      for (const match of text.matchAll(re)) {
        names.add(match[1]);
      }
    }

    return [...names];
  }

  /**
   * Пакетно удаляет объекты из бакета. Best-effort: ошибку логируем, но не
   * пробрасываем — осиротевший файл не должен ломать удаление заметки.
   */
  async removeMany(objectNames: string[]): Promise<void> {
    if (!objectNames.length) return;

    try {
      await this.client.removeObjects(this.bucket, objectNames);
      this.logger.log(`Removed ${objectNames.length} object(s) from MinIO`);
    } catch (error) {
      this.logger.error(
        `MinIO removeObjects failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Возвращает поток объекта и его метаданные для проксирования браузеру.
   */
  async getObject(objectName: string): Promise<{
    stream: Readable;
    contentType: string;
    size: number;
  }> {
    try {
      const stat = await this.client.statObject(this.bucket, objectName);
      const stream = await this.client.getObject(this.bucket, objectName);

      return {
        stream,
        contentType:
          stat.metaData['content-type'] ?? 'application/octet-stream',
        size: stat.size,
      };
    } catch {
      throw new NotFoundException('Изображение не найдено');
    }
  }
}
